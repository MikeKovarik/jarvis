import base64url from '@hexagon/base64-arraybuffer'
import koaRouter from '@koa/router'
import Fido2 from '../utils/fido2.js'
import config from '../config.js'
import database from '../db/db.js'
import {fail, success} from './util.js'


const router = koaRouter({ prefix: '/webauthn' })

const f2l = new Fido2(config.rpId, config.rpName, config.challengeTimeoutMs)

const transports = ['usb', 'nfc', 'ble', 'internal']

router.post('/register', async (ctx) => {
	console.log('GET /REGISTER')

	if (!ctx.request.body || !ctx.request.body.name)
		return fail(ctx, 'ctx missing name or username field!')

	let challengeMakeCred = await f2l.registration(ctx.request.body.name)
	ctx.session.challenge = challengeMakeCred.challenge
	return ctx.body = challengeMakeCred
})


router.post('/add', async (ctx) => {
	console.log('GET /ADD')

	if (!ctx.request.body)
		return fail(ctx, 'ctx missing name or username field!')

	if (!ctx.session.loggedIn)
		return fail(ctx, 'User not logged in!')

	let usernameClean = 'foo'
	let name = 'foo'
	let id = 'foo'


	let challengeMakeCred = await f2l.registration(usernameClean, name, id)
    
	// Transfer challenge to session
	ctx.session.challenge = challengeMakeCred.challenge

	// Exclude existing credentials
	challengeMakeCred.excludeCredentials = database.map(({id, type}) => ({ id, type }))

	// Respond with credentials
	return ctx.body = challengeMakeCred
})


router.post('/login', async (ctx) => {
	console.log('GET /LOGIN')
	//let usernameClean = sanitizeUsername(ctx.request.body.username)
	let usernameClean = 'foo'

	let assertionOptions = await f2l.login(usernameClean)

	// Transfer challenge and username to session
	ctx.session.challenge = assertionOptions.challenge

	// Pass this, to limit selectable credentials for user... This may be set in response instead, so that
	// all of a users server (public) credentials isn't exposed to anyone
	let allowCredentials = database.map(({type, id}) => ({type, id, transports}))

	assertionOptions.allowCredentials = allowCredentials

	ctx.session.allowCredentials = allowCredentials

	return ctx.body = assertionOptions
})


router.post('/response', async (ctx) => {

	let {body} = ctx.request

	if (!body       || !body.id
    || !body.rawId || !body.response
    || !body.type  || body.type !== 'public-key' ) {
		return fail(ctx, 'Response missing one or more of id/rawId/response/type fields, or type is not public-key!')
	}

	if (body.response.attestationObject !== undefined) {
		console.log('GET /RESPONSE A')
		await handleRegistrationResponse(body, ctx)
		ctx.session.loggedIn = true
		return success(ctx)
	} else if (body.response.authenticatorData !== undefined) {
		console.log('GET /RESPONSE B')
		let winningAuthenticator = await handleLoginResponse(body, ctx)
		// authentication complete!
		if (winningAuthenticator) {
			ctx.session.loggedIn = true
			return success(ctx)
		} else {
			return fail(ctx, 'Can not authenticate signature!')
		}
	} else {
		return fail(ctx, 'Can not authenticate signature!')
	}
})

async function handleRegistrationResponse(body, ctx) {
	/* This is create cred */
	body.rawId = base64ToUint8(body.rawId, true)
	body.response.attestationObject = base64ToUint8(body.response.attestationObject, true)
	const result = await f2l.attestation(body, config.origin, ctx.session.challenge)
	
	const credId = result.authnrData.get('credId')
	const id = uint8ToBase64(credId)

	const token = {
		id,
		publicKey: result.authnrData.get('credentialPublicKeyPem'),
		type: body.type,
		counter: 0,
	}

	database.push(token)
}

async function handleLoginResponse(body, ctx) {
	/* This is get assertion */
	//result = utils.verifyAuthenticatorAssertionResponse(body, database.users[ctx.session.username].authenticators)
	// add allowCredentials to limit the number of allowed credential for the authentication process. For further details refer to webauthn specs: (https://www.w3.org/TR/webauthn-2/#dom-publickeycredentialctxoptions-allowcredentials).
	// save the challenge in the session information...
	// send authnOptions to client and pass them in to `navigator.credentials.get()`...
	// get response back from client (clientAssertionResponse)
	body.rawId = base64ToUint8(body.rawId, true)
	body.response.userHandle = base64ToUint8(body.rawId, true)
	let validAuthenticators = [...database]
	for (let authrIdx in validAuthenticators) {
		let authr = validAuthenticators[authrIdx]
		try {

			let assertionExpectations = {
				// Remove the following comment if allowCredentials has been added into authnOptions so the credential received will be validate against allowCredentials array.
				allowCredentials: ctx.session.allowCredentials,
				challenge: ctx.session.challenge,
				origin: config.origin,
				factor: 'either',
				publicKey: authr.publicKey,
				prevCounter: 0,
				userHandle: base64ToUint8(authr.id)
			}

			let result = await f2l.assertion(body, assertionExpectations)

			return result
		} catch {}
	}
}

const uint8ToBase64 = buffer => base64url.encode(buffer, true)
const base64ToUint8 = buffer => base64url.decode(buffer, true)

export default router