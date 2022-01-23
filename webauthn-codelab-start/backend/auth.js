import express from 'express'
import {loadCredentials, saveCredentials} from './db.js'
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
	let user = loadCredentials()
    console.log('~ user', user)
	req.session.loggedIn = true
	res.json(user)
})

router.get('/logout', (req, res) => {
	req.session.destroy()
	res.json({})
})

router.post('/get-keys', csrfGuard, loggedInGuard, (req, res) => {
	let user = loadCredentials()
	res.json(user || {})
})

// Removes a credential id attached to the user
router.post('/remove-key', csrfGuard, loggedInGuard, (req, res) => {
	let credId = req.query.credId
	let {credentials} = loadCredentials()
	credentials = credentials.filter(cred => cred.credId !== credId)
	saveCredentials(undefined, {credentials})
	res.json({})
})

const wrapWebAuthnReq = handler => async (req, res) => {
	try {
		res.json(await handler(req, res))
	} catch ({message}) {
		delete req.session.expectedChallenge
		res.status(400).json({message})
	}
}

// Respond with required information to call navigator.credential.create()
router.post('/register-request', csrfGuard, loggedInGuard, wrapWebAuthnReq(async req => {
	const {headers, session, body} = req
	let options = await webauthn.registerRequest({
		headers,
		credential: body,
	})
    console.log('~ options', options)
	session.expectedChallenge = options.challenge
	return options
}))

// Register user credential.
router.post('/register-response', csrfGuard, loggedInGuard, wrapWebAuthnReq(async req => {
	const {headers, session, body} = req
	let user = await webauthn.registerResponse({
		headers,
		credential: body,
		expectedChallenge: session.expectedChallenge,
	})
	delete session.expectedChallenge
	return user
}))

// Respond with required information to call navigator.credential.get()
router.post('/login-request', csrfGuard, wrapWebAuthnReq(async req => {
	const {headers, session} = req
	let options = await webauthn.loginRequest({headers})
	session.expectedChallenge = options.challenge
	return options
}))

// Authenticate the user.
router.post('/login-response', csrfGuard, wrapWebAuthnReq(async req => {
	const {headers, session, body} = req
	let user = await webauthn.loginResponse({
		headers,
		credential: body,
		expectedChallenge: session.expectedChallenge,
	})
	session.loggedIn = true
	delete session.expectedChallenge
	return user
}))
