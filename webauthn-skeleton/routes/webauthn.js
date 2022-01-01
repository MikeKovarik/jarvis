import crypto from 'crypto'
import base64url from '@hexagon/base64-arraybuffer'
import koaRouter from '@koa/router'
import Fido2 from '../utils/fido2.js'
import config from '../config.js'
import database from '../db/db.js'
import sanitizeUsername from '../utils/username.js'

const router = koaRouter({ prefix: '/webauthn' })

const f2l       = new Fido2(config.rpId, config.rpName, undefined, config.challengeTimeoutMs)
/**
 * Returns base64url encoded buffer of the given length
 * @param  {Number} len - length of the buffer
 * @return {String}     - base64url random buffer
 */
let randomBase64URLBuffer = (len) => {
	len = len || 32;
	let buff = crypto.randomBytes(len);
	return uint8ToBase64(buff, true);
};

const transports = ['usb', 'nfc', 'ble', 'internal']

router.post('/register', async (ctx) => {
	if (!ctx.request.body || !ctx.request.body.username || !ctx.request.body.name) {
		return ctx.body = {
			'status': 'failed',
			'message': 'ctx missing name or username field!'
		};
	}

	let usernameClean = 'foo'
	let name = 'foo'
	let id = 'foo'

	/*
	let usernameClean = sanitizeUsername(ctx.request.body.username),
		name     = usernameClean;

	if (!usernameClean) {
		return ctx.body = {
			'status': 'failed',
			'message': 'Invalid username!'
		};
	}

	if (database.users[usernameClean] && database.users[usernameClean].registered) {
		return ctx.body = {
			'status': 'failed',
			'message': `Username ${username} already exists`
		};
	}

	let id = randomBase64URLBuffer();

	database.users[usernameClean] = {
		'name': name,
		'registered': false,
		'id': id,
		'authenticators': [],
		'oneTimeToken': undefined,
		'recoveryEmail': undefined
	};
	*/

	let challengeMakeCred = await f2l.registration(usernameClean, name, id);
    
	// Transfer challenge and username to session
	ctx.session.challenge = challengeMakeCred.challenge;
	//ctx.session.username  = usernameClean;

	// Respond with credentials
	return ctx.body = challengeMakeCred;
});


router.post('/add', async (ctx) => {
	if (!ctx.request.body) {
		return ctx.body = {
			'status': 'failed',
			'message': 'ctx missing name or username field!'
		};
	}

	if (!ctx.session.loggedIn) {
		return ctx.body = {
			'status': 'failed',
			'message': 'User not logged in!'
		};
	}

    console.log('~ ctx.session.username', ctx.session.username)
/*
	let usernameClean = sanitizeUsername(ctx.session.username),
		name     = usernameClean,
		id       = database.users[ctx.session.username].id;
*/
	let usernameClean = 'foo'
	let name = 'foo'
	let id = 'foo'

    console.log('~ usernameClean', usernameClean)
    console.log('~ name', name)
    console.log('~ id', id)

	let challengeMakeCred = await f2l.registration(usernameClean, name, id);
    console.log('~ challengeMakeCred', challengeMakeCred)
    
	// Transfer challenge to session
	ctx.session.challenge = challengeMakeCred.challenge;

	// Exclude existing credentials
	const mapFn = ({id, type}) => ({ id, type })
	/*
	challengeMakeCred.excludeCredentials = database.users[ctx.session.username].authenticators.map(mapFn)
	*/
	challengeMakeCred.excludeCredentials = database.map(mapFn)
    console.log('~ challengeMakeCred.excludeCredentials', challengeMakeCred.excludeCredentials)

	// Respond with credentials
	return ctx.body = challengeMakeCred;
});

router.post('/login', async (ctx) => {
	console.log('GET /login')
    console.log('~ ctx.request.body.username', ctx.request.body.username)
	//let usernameClean = sanitizeUsername(ctx.request.body.username);
	let usernameClean = 'foo'
    console.log('~ usernameClean', usernameClean)
/*
	if (!database.users[usernameClean] || !database.users[usernameClean].registered) {
		return ctx.body = {
			'status': 'failed',
			'message': `User ${usernameClean} does not exist!`
		};
	}
*/
	let assertionOptions = await f2l.login(usernameClean);
    console.log('~ assertionOptions', assertionOptions)

	// Transfer challenge and username to session
	ctx.session.challenge = assertionOptions.challenge;
	ctx.session.username  = usernameClean;
    console.log('~ ctx.session.challenge', ctx.session.challenge)
    console.log('~ ctx.session.username', ctx.session.username)

	// Pass this, to limit selectable credentials for user... This may be set in response instead, so that
	// all of a users server (public) credentials isn't exposed to anyone
	let allowCredentials = database.map(({type, id}) => allowCredentials.push({type, id, transports}))

	assertionOptions.allowCredentials = allowCredentials

	ctx.session.allowCredentials = allowCredentials

	return ctx.body = assertionOptions
});

router.post('/response', async (ctx) => {
	console.log('GET /response')
	if (!ctx.request.body       || !ctx.request.body.id
    || !ctx.request.body.rawId || !ctx.request.body.response
    || !ctx.request.body.type  || ctx.request.body.type !== 'public-key' ) {
		return ctx.body = {
			'status': 'failed',
			'message': 'Response missing one or more of id/rawId/response/type fields, or type is not public-key!'
		};
	}
	let webauthnResp = ctx.request.body;
	if (webauthnResp.response.attestationObject !== undefined) {
        console.log('~ webauthnResp.response.attestationObject')
		/* This is create cred */
		webauthnResp.rawId = base64ToUint8(webauthnResp.rawId, true);
		webauthnResp.response.attestationObject = base64ToUint8(webauthnResp.response.attestationObject, true);
		const result = await f2l.attestation(webauthnResp, config.origin, ctx.session.challenge);
        
		const credId = result.authnrData.get('credId')
		const id = uint8ToBase64(credId)

		const token = {
			id,
			credId,
			publicKey: result.authnrData.get('credentialPublicKeyPem'),
			type: webauthnResp.type,
			counter: 0,
		};

		database.push(token);
		//database.users[ctx.session.username].authenticators.push(token);
		//database.users[ctx.session.username].registered = true;

		ctx.session.loggedIn = true;

		return ctx.body = { 'status': 'ok' };


	} else if (webauthnResp.response.authenticatorData !== undefined) {
        console.log('~ webauthnResp.response.authenticatorData')
		/* This is get assertion */
		//result = utils.verifyAuthenticatorAssertionResponse(webauthnResp, database.users[ctx.session.username].authenticators);
		// add allowCredentials to limit the number of allowed credential for the authentication process. For further details refer to webauthn specs: (https://www.w3.org/TR/webauthn-2/#dom-publickeycredentialctxoptions-allowcredentials).
		// save the challenge in the session information...
		// send authnOptions to client and pass them in to `navigator.credentials.get()`...
		// get response back from client (clientAssertionResponse)
		webauthnResp.rawId = base64ToUint8(webauthnResp.rawId, true);
		webauthnResp.response.userHandle = base64ToUint8(webauthnResp.rawId, true);
		//let validAuthenticators = database.users[ctx.session.username].authenticators
		let validAuthenticators = [...database]
		let winningAuthenticator;            
		for (let authrIdx in validAuthenticators) {
			let authr = validAuthenticators[authrIdx];
			try {

				const userHandle = base64ToUint8(authr.id)
				let assertionExpectations = {
					// Remove the following comment if allowCredentials has been added into authnOptions so the credential received will be validate against allowCredentials array.
					allowCredentials: ctx.session.allowCredentials,
					challenge: ctx.session.challenge,
					origin: config.origin,
					factor: 'either',
					publicKey: authr.publicKey,
					prevCounter: 0,
					userHandle
				};

				let result = await f2l.assertion(webauthnResp, assertionExpectations);

				winningAuthenticator = result;
				break
        
			} catch {}
		}
		// authentication complete!
		//if (winningAuthenticator && database.users[ctx.session.username].registered ) {
		if (winningAuthenticator) {
			ctx.session.loggedIn = true;
			return ctx.body = { 'status': 'ok' };

			// Authentication failed
		} else {
			return ctx.body = {
				'status': 'failed',
				'message': 'Can not authenticate signature!'
			};
		}
	} else {
		return ctx.body = {
			'status': 'failed',
			'message': 'Can not authenticate signature!'
		};
	}
});

router.get('/db', async (ctx) => {
	return ctx.body = JSON.stringify(database, null, 2)
})

const uint8ToBase64 = buffer => base64url.encode(buffer, true)
const base64ToUint8 = buffer => base64url.decode(buffer, true)

export default router;