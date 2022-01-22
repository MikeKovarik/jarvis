import express from 'express'
import crypto from 'crypto'
import base64url from 'base64url'
import {loadUser, addUser, updateUser} from './db.js'
import {csrfGuard, loggedInGuard} from './guards.js'
import WebAuthn from './webauthn.js'


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
	if ((!webauthn.rpID || !webauthn.origin) && req.headers.origin) {
		webauthn.rpID   = req.headers.host.split(':')[0] // remove port
		webauthn.origin = req.headers.origin // full url with protocol and port
	}
	next()
})

router.get('/', (req, res) => {
	let {username, loggedIn} = req.session
	loggedIn = !!loggedIn
	res.json({username, loggedIn})
})


// Check username, create a new account if it doesn't exist.
router.post('/username', (req, res) => {
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

// Verifies user credential and let the user sign-in. No preceding registration required.
// This only checks if `username` is not empty string and ignores the password.
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

router.get('/logout', (req, res) => {
	req.session.destroy()
	res.json({})
})

// Returns a credential id. (This server only stores one key per username.)
router.post('/get-keys', csrfGuard, loggedInGuard, (req, res) => {
	const user = loadUser(req.session.username)
	res.json(user || {})
})

// Removes a credential id attached to the user
router.post('/remove-key', csrfGuard, loggedInGuard, (req, res) => {
	const credId = req.query.credId
	const username = req.session.username
	const user = loadUser(username)
	const credentials = user.credentials.filter(cred => cred.credId !== credId)
	updateUser(username, {credentials})
	res.json({})
})

// Respond with required information to call navigator.credential.create()
router.post('/register-request', csrfGuard, loggedInGuard, async (req, res) => {
	try {
		let options = await webauthn.registerRequest(req.session.username, req.body)
		req.session.challenge = options.challenge
		res.json(options)
	} catch ({message}) {
		res.status(400).json({message})
	}
})

// Register user credential.
router.post('/register-response', csrfGuard, loggedInGuard, async (req, res) => {
	try {
		let user = await webauthn.registerResponse(req.session.challenge, req.session.username, req.body)
		delete req.session.challenge
		res.json(user)
	} catch ({message}) {
		delete req.session.challenge
		res.status(400).json({message})
	}
})

// Respond with required information to call navigator.credential.get()
router.post('/login-request', csrfGuard, async (req, res) => {
	try {
		let options = await webauthn.loginRequest(req.session.username)
		req.session.challenge = options.challenge
		res.json(options)
	} catch ({message}) {
		res.status(400).json({message})
	}
})

// Authenticate the user.
router.post('/login-response', csrfGuard, async (req, res) => {
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
