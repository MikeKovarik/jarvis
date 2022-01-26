import express from 'express'
import {getAll, loadCredentials, saveCredentials} from './db.js'
import {csrfGuard, loggedInGuard} from './guards.js'
import WebAuthn from './webauthn.js'
import config from './config.js'


const router = express.Router()
router.use(express.json())
export default router

const webauthn = new WebAuthn({
	loadUser: loadCredentials,
	updateUser: saveCredentials,
	rpName: config.rpName,
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
	req.session.loggedIn = true
	res.json(user)
})

router.get('/logout', (req, res) => {
	req.session.destroy()
	res.json({})
})

router.get('/credentials', csrfGuard, loggedInGuard, (req, res) => {
	//let username = getUsername(req)
	//let {credentials} = loadCredentials(username)
	//credentials = credentials.map(({publicKey, ...cred}) => cred)
	let credentials = getAll()
	res.json(credentials)
})

router.delete('/credentials/:credId', csrfGuard, loggedInGuard, (req, res) => {
	let username = getUsername(req)
	let {credentials} = loadCredentials(username)
	let {credId} = req.params
	credentials = credentials.filter(cred => cred.credId !== credId)
	saveCredentials(username, {credentials})
	res.json({})
})

const wrapWebAuthnReq = handler => async (req, res) => {
	try {
		let data = await handler(req, res)
		if (data)
			res.json(data)
		else
			res.end()
	} catch ({message}) {
		delete req.session.expectedChallenge
		res.status(400).json({message})
	}
}

const preProcessParams = req => {
	const {rpID, origin} = webauthn.getRpFromHeaders(req.headers)
	return {
		username: rpID,
		rpID,
		origin,
		credential: req.body,
	}
}

const getUsername = req => webauthn.getRpFromHeaders(req.headers).rpID

// Respond with required information to call navigator.credential.create()
router.post('/register-request', csrfGuard, loggedInGuard, wrapWebAuthnReq(async req => {
	let options = await webauthn.registerRequest(preProcessParams(req))
	req.session.expectedChallenge = options.challenge
	return options
}))

// Register user credential.
router.post('/register-response', csrfGuard, loggedInGuard, wrapWebAuthnReq(async req => {
	await webauthn.registerResponse({
		...preProcessParams(req),
		expectedChallenge: req.session.expectedChallenge,
	})
	delete req.session.expectedChallenge
}))

// Respond with required information to call navigator.credential.get()
router.post('/login-request', csrfGuard, wrapWebAuthnReq(async req => {
	let options = await webauthn.loginRequest(preProcessParams(req))
	req.session.expectedChallenge = options.challenge
	return options
}))

// Authenticate the user.
router.post('/login-response', csrfGuard, wrapWebAuthnReq(async req => {
	await webauthn.loginResponse({
		...preProcessParams(req),
		expectedChallenge: req.session.expectedChallenge,
	})
	req.session.loggedIn = true
	delete req.session.expectedChallenge
}))
