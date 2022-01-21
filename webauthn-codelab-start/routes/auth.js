import express from 'express'
import crypto from 'crypto'
import base64url from 'base64url'
import {loadUser, addUser, updateUser} from './db.js'
import {csrfGuard, signedInGuard} from './guards.js'
import WebAuthn from './authlib.js'


const router = express.Router()
router.use(express.json())
export default router

const webauthn = new WebAuthn({
	loadUser,
	updateUser,
	rpName: 'WebAuthn Codelab',
	// origin and rpID will be resolved at runtime
	//rpID: process.env.HOSTNAME,
	//origin: process.env.ORIGIN,
})

router.use((req, res, next) => {
	//req.session.username = 'mike'
	//req.session.loggedIn = true
	if (webauthn.rpID === undefined) {
		webauthn.rpID   = req.headers.host.split(':')[0] // remove port
		webauthn.origin = req.headers.origin // full url with protocol and port
	}
	next()
})


/**
 * Check username, create a new account if it doesn't exist.
 * Set a `username` in the session.
 **/
router.post('/username', (req, res) => {
    console.log('~ req.body', req.body)
	const username = req.body.username
	// Only check username, no need to check password as this is a mock
	if (!username || !/[a-zA-Z0-9-_]+/.test(username)) {
		res.status(400).send({error: 'Bad request'})
		return
	} else {
		// See if account already exists
		let user = loadUser(username)
		// If user entry is not created yet, create one
		if (!user) {
			addUser(username, {
				id: base64url.encode(crypto.randomBytes(32)),
				credentials: [],
			})
		}
		// Set username in the session
		req.session.username = username
		// If sign-in succeeded, redirect to `/home`.
		res.json(user)
	}
})

/**
 * Verifies user credential and let the user sign-in.
 * No preceding registration required.
 * This only checks if `username` is not empty string and ignores the password.
 **/
router.post('/password', (req, res) => {
	if (!req.body.password) {
		res.status(401).json({error: 'Enter at least one random letter.'})
		return
	}
	const user = loadUser(req.session.username)

	if (!user) {
		res.status(401).json({error: 'Enter username first.'})
		return
	}

	req.session.loggedIn = true
	res.json(user)
})

router.get('/signout', (req, res) => {
	// Remove the session
	req.session.destroy()
	// Redirect to `/`
	res.redirect(307, '/')
})

/**
 * Returns a credential id
 * (This server only stores one key per username.)
 * Response format:
 * ```{
 *   username: String,
 *   credentials: [Credential]
 * }```

 Credential
 ```
 {
   credId: String,
   publicKey: String,
   aaguid: ??,
   prevCounter: Int
 };
 ```
 **/
router.post('/get-keys', csrfGuard, signedInGuard, (req, res) => {
	const user = loadUser(req.session.username)
	res.json(user || {})
})

/**
 * Removes a credential id attached to the user
 * Responds with empty JSON `{}`
 **/
router.post('/remove-key', csrfGuard, signedInGuard, (req, res) => {
	const credId = req.query.credId
	const username = req.session.username
	const user = loadUser(username)
	const credentials = user.credentials.filter(cred => cred.credId !== credId)
	updateUser(username, {credentials})
	res.json({})
})

/**
 * Respond with required information to call navigator.credential.create()
 * Input is passed via `req.body` with similar format as output
 * Output format:
 * ```{
     rp: {
       id: String,
       name: String
     },
     user: {
       displayName: String,
       id: String,
       name: String
     },
     publicKeyCredParams: [{
       type: 'public-key', alg: -7
     }],
     timeout: Number,
     challenge: String,
     excludeCredentials: [{
       id: String,
       type: 'public-key',
       transports: [('ble'|'nfc'|'usb'|'internal'), ...]
     }, ...],
     authenticatorSelection: {
       authenticatorAttachment: ('platform'|'cross-platform'),
       requireResidentKey: Boolean,
       userVerification: ('required'|'preferred'|'discouraged')
     },
     attestation: ('none'|'indirect'|'direct')
 * }```
 **/
router.post('/register-request', csrfGuard, signedInGuard, async (req, res) => {
	console.log('/register-request')
	try {
		let options = await webauthn.registerRequest(req.session.username, req.body)
		req.session.challenge = options.challenge
		res.json(options)
	} catch ({message}) {
		res.status(400).json({message})
	}
})

/**
 * Register user credential.
 * Input format:
 * ```{
     id: String,
     type: 'public-key',
     rawId: String,
     response: {
       clientDataJSON: String,
       attestationObject: String,
       signature: String,
       userHandle: String
     }
 * }```
 **/
router.post('/register-response', csrfGuard, signedInGuard, async (req, res) => {
	console.log('/register-response')
	try {
		let user = await webauthn.registerResponse(req.session.challenge, req.session.username, req.body)
		delete req.session.challenge
		res.json(user)
	} catch ({message}) {
		delete req.session.challenge
		res.status(400).json({message})
	}
})

/**
 * Respond with required information to call navigator.credential.get()
 * Input is passed via `req.body` with similar format as output
 * Output format:
 * ```{
     challenge: String,
     userVerification: ('required'|'preferred'|'discouraged'),
     allowCredentials: [{
       id: String,
       type: 'public-key',
       transports: [('ble'|'nfc'|'usb'|'internal'), ...]
     }, ...]
 * }```
 **/
router.post('/login-request', csrfGuard, async (req, res) => {
	console.log('/login-request')
	try {
		let options = await webauthn.loginRequest(req.session.username)
        console.log('~ options', options)
		req.session.challenge = options.challenge
		res.json(options)
	} catch ({message}) {
		res.status(400).json({message})
	}
})

/**
 * Authenticate the user.
 * Input format:
 * ```{
     id: String,
     type: 'public-key',
     rawId: String,
     response: {
       clientDataJSON: String,
       authenticatorData: String,
       signature: String,
       userHandle: String
     }
 * }```
 **/
router.post('/login-response', csrfGuard, async (req, res) => {
	console.log('/login-response')
	try {
		let user = await webauthn.loginResponse(req.session.challenge, req.session.username, req.body)
		delete req.session.challenge
		req.session.loggedIn = true
		res.json(user)
	} catch ({message}) {
		delete req.session.challenge
		res.status(400).json({message})
	}
})
