import express from 'express'
import crypto from 'crypto'
import fido2 from '@simplewebauthn/server'
import base64url from 'base64url'
import fs from 'fs'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync.js'


const adapter = new FileSync('./data/webauthn.json')
const db = low(adapter)

const router = express.Router()
router.use(express.json())
export default router

const RP_NAME = 'WebAuthn Codelab'
const TIMEOUT = 30 * 1000 * 60

db.defaults({
	users: [],
}).write()

const csrfGuard = (req, res, next) => {
	if (req.header('X-Requested-With') !== 'XMLHttpRequest') {
		res.status(400).json({error: 'invalid access.'})
		return
	}
	next()
}

/**
 * Checks CSRF protection using custom header `X-Requested-With`
 * If the session doesn't contain `signed-in`, consider the user is not authenticated.
 **/
const signedInGuard = (req, res, next) => {
	if (!req.session.loggedIn) {
		res.status(401).json({error: 'not signed in.'})
		return
	}
	next()
}

/**
 * Check username, create a new account if it doesn't exist.
 * Set a `username` in the session.
 **/
router.post('/username', (req, res) => {
    console.log('~ req.body', req.body)
	const username = req.body.username
    console.log('~ username', username)
	// Only check username, no need to check password as this is a mock
	if (!username || !/[a-zA-Z0-9-_]+/.test(username)) {
		res.status(400).send({error: 'Bad request'})
		return
	} else {
		// See if account already exists
		let user = db.get('users').find({username}).value()
		// If user entry is not created yet, create one
		if (!user) {
			user = {
				username,
				id: base64url.encode(crypto.randomBytes(32)),
				credentials: [],
			}
			db.get('users').push(user).write()
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
	const user = db
		.get('users')
		.find({username: req.session.username})
		.value()

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
	const user = db
		.get('users')
		.find({username: req.session.username})
		.value()
	res.json(user || {})
})

/**
 * Removes a credential id attached to the user
 * Responds with empty JSON `{}`
 **/
router.post('/remove-key', csrfGuard, signedInGuard, (req, res) => {
	const credId = req.query.credId
	const username = req.session.username
	const user = db.get('users').find({username}).value()

	// Leave credential ids that do not match
	const newCreds = user.credentials.filter(cred => cred.credId !== credId)

	db.get('users')
		.find({username})
		.assign({credentials: newCreds})
		.write()

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
     publicKeyCredParams: [{  // @herrjemand
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
		let options = await registerRequest(req.session.username, req.body)
		req.session.challenge = options.challenge
		res.json(options)
	} catch (error) {
		res.status(400).send({error})
	}
})

async function registerRequest(username, body) {
	const user = db.get('users')
		.find({username})
		.value()

	const excludeCredentials = []
	if (user.credentials.length > 0) {
		for (let cred of user.credentials) {
			excludeCredentials.push({
				id: base64url.toBuffer(cred.credId),
				type: 'public-key',
				transports: ['internal'],
			})
		}
	}

	const pubKeyCredParams = []
	// const params = [-7, -35, -36, -257, -258, -259, -37, -38, -39, -8];
	const params = [-7, -257]
	for (let param of params) {
		pubKeyCredParams.push({type: 'public-key', alg: param})
	}

	const as = {} // authenticatorSelection
	const aa = body.authenticatorSelection.authenticatorAttachment
	const rr = body.authenticatorSelection.requireResidentKey
	const uv = body.authenticatorSelection.userVerification
	const cp = body.attestation // attestationConveyancePreference
	let asFlag = false
	let authenticatorSelection
	let attestation = 'none'

	if (aa && (aa === 'platform' || aa === 'cross-platform')) {
		asFlag = true
		as.authenticatorAttachment = aa
	}
	if (rr && typeof rr === 'boolean') {
		asFlag = true
		as.requireResidentKey = rr
	}
	if (uv && (uv === 'required' || uv === 'preferred' || uv === 'discouraged')) {
		asFlag = true
		as.userVerification = uv
	}
	if (asFlag) {
		authenticatorSelection = as
	}
	if (cp && (cp === 'none' || cp === 'indirect' || cp === 'direct')) {
		attestation = cp
	}

	const options = fido2.generateRegistrationOptions({
		rpName: RP_NAME,
		rpID: process.env.HOSTNAME,
		userID: user.id,
		userName: user.username,
		timeout: TIMEOUT,
		// Prompt users for additional information about the authenticator.
		attestationType: attestation,
		// Prevent users from re-registering existing authenticators
		excludeCredentials,
		authenticatorSelection,
	})

	// Temporary hack until SimpleWebAuthn supports `pubKeyCredParams`
	options.pubKeyCredParams = []
	for (let param of params) {
		options.pubKeyCredParams.push({type: 'public-key', alg: param})
	}

	return options
}

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
		let user = await registerResponse(req.session.challenge, req.session.username, req.body)
		delete req.session.challenge
		res.json(user)
	} catch (e) {
		delete req.session.challenge
		res.status(400).send({error: e.message})
	}
})

async function registerResponse(expectedChallenge, username, body) {
	const expectedOrigin = process.env.ORIGIN
	const expectedRPID = process.env.HOSTNAME

	const verification = await fido2.verifyRegistrationResponse({
		credential: body,
		expectedChallenge,
		expectedOrigin,
		expectedRPID,
	})

	const {verified, registrationInfo} = verification

	if (!verified) {
		throw 'User verification failed.'
	}

	const {credentialPublicKey, credentialID, counter} = registrationInfo
	const base64PublicKey = base64url.encode(credentialPublicKey)
	const base64CredentialID = base64url.encode(credentialID)

	const user = db.get('users')
		.find({username})
		.value()

	const existingCred = user.credentials.find(cred => cred.credID === base64CredentialID)

	if (!existingCred) {
		/**
		 * Add the returned device to the user's list of devices
		 */
		user.credentials.push({
			publicKey: base64PublicKey,
			credId: base64CredentialID,
		})
	}

	console.log('assign user', user)

	db.get('users')
		.find({username})
		.assign(user)
		.write()

	return user
}

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
		let options = await loginRequest(req.session.username, req.body.userVerification)
		req.session.challenge = options.challenge
		res.json(options)
	} catch (error) {
		res.status(400).json({error})
	}
})

async function loginRequest(username, userVerification = 'required') {
	let rpID = process.env.HOSTNAME
	
	const user = db
		.get('users')
		.find({username})
		.value()

	// Send empty response if user is not registered yet.
	if (!user) throw 'User not found.'

	const allowCredentials = user.credentials.map(getAllowedCredential)

	const options = fido2.generateAuthenticationOptions({
		timeout: TIMEOUT,
		rpID,
		allowCredentials,
		// This optional value controls whether or not the authenticator needs be able to uniquely
		// identify the user interacting with it (via built-in PIN pad, fingerprint scanner, etc...)
		userVerification,
	})

	return options
}

const getAllowedCredential = cred => ({
	id: base64url.toBuffer(cred.credId),
	type: 'public-key',
	transports: ['internal'],
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
		let user = await loginResponse(req.session.challenge, req.session.username, req.body)
		delete req.session.challenge
		req.session.loggedIn = true
		res.json(user)
	} catch (error) {
		delete req.session.challenge
		res.status(400).json({error})
	}
})

async function loginResponse(expectedChallenge, username, body) {
	const expectedOrigin = process.env.ORIGIN
	const expectedRPID = process.env.HOSTNAME

	// Query the user
	const user = db
		.get('users')
		.find({username})
		.value()

	let credential = user.credentials.find(cred => cred.credId === body.id)

	if (!credential) throw 'Authenticating credential not found.'

	const verification = fido2.verifyAuthenticationResponse({
		credential: body,
		expectedChallenge,
		expectedOrigin,
		expectedRPID,
		authenticator: {
			...credential,
			credentialPublicKey: base64url.toBuffer(credential.publicKey),
			credentialID: base64url.toBuffer(credential.credId),
			prevCounter: 0,
			counter: 0,
		},
	})

	const {verified, authenticationInfo} = verification
	console.log('~ verified', verified)
	console.log('~ authenticationInfo', authenticationInfo)

	if (!verified) throw 'User verification failed.'

	console.log('assign user', user)

	db.get('users')
		.find({username})
		.assign(user)
		.write()

	return user
}