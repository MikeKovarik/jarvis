import express from 'express'
import {defaultId, defaultName, loadCredentials, saveCredentials} from './db.js'
import {csrfGuard, loggedInGuard} from './guards.js'
import WebAuthn from './webauthn.js'
import {rpName} from './config.js'


const router = express.Router()
router.use(express.json())
export default router

const webauthn = new WebAuthn({
	loadUser: loadCredentials,
	updateUser: saveCredentials,
	rpName,
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
	let loggedIn = !!req.session.loggedIn
	res.json({loggedIn})
})


router.post('/password', (req, res) => {
	if (!req.body.password) {
		res.status(401).json({error: 'Enter at least one random letter.'})
		return
	}
	const user = loadCredentials()
    console.log('~ user', user)
	req.session.loggedIn = true
	res.json(user)
})

router.get('/logout', (req, res) => {
	req.session.destroy()
	res.json({})
})

router.post('/get-keys', csrfGuard, loggedInGuard, (req, res) => {
	const user = loadCredentials()
	res.json(user || {})
})

// Removes a credential id attached to the user
router.post('/remove-key', csrfGuard, loggedInGuard, (req, res) => {
	const credId = req.query.credId
	let {credentials} = loadCredentials()
	credentials = credentials.filter(cred => cred.credId !== credId)
	saveCredentials(undefined, {credentials})
	res.json({})
})

// Respond with required information to call navigator.credential.create()
router.post('/register-request', csrfGuard, loggedInGuard, async (req, res) => {
	try {
		let options = await webauthn.registerRequest(defaultName, req.body)
		req.session.challenge = options.challenge
		res.json(options)
	} catch ({message}) {
		res.status(400).json({message})
	}
})

// Register user credential.
router.post('/register-response', csrfGuard, loggedInGuard, async (req, res) => {
	try {
		let credential = req.body
		let user = await webauthn.registerResponse(req.session.challenge, defaultName, credential)
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
		let options = await webauthn.loginRequest(defaultName)
		req.session.challenge = options.challenge
		res.json(options)
	} catch ({message}) {
		res.status(400).json({message})
	}
})

// Authenticate the user.
router.post('/login-response', csrfGuard, async (req, res) => {
	try {
		let user = await webauthn.loginResponse(req.session.challenge, defaultName, req.body)
		delete req.session.challenge
		req.session.loggedIn = true
		res.json(user)
	} catch ({message}) {
		delete req.session.challenge
		res.status(400).json({message})
	}
})
