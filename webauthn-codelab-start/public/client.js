import {bufferToBase64, base64ToBuffer} from './util.js'


export const postJson = async (path, payload = '') => {
	const headers = {
		'X-Requested-With': 'XMLHttpRequest',
	}
	if (payload && !(payload instanceof FormData)) {
		headers['Content-Type'] = 'application/json'
		payload = JSON.stringify(payload)
	}
	const res = await fetch(path, {
		method: 'POST',
		credentials: 'same-origin',
		headers: headers,
		body: payload,
	})
	if (res.status === 200) {
		// Server authentication succeeded
		return res.json()
	} else {
		// Server authentication failed
		const result = await res.json()
		throw result.error
	}
}

export const registerCredential = async () => {
	console.log('registerCredential()')
	const opts = {
		attestation: 'none',
		authenticatorSelection: {
			authenticatorAttachment: 'platform',
			userVerification: 'required',
			requireResidentKey: false,
		},
	}

	const options = await postJson('/auth/register-request', opts)

	options.user.id = base64url.decode(options.user.id)
	options.challenge = base64url.decode(options.challenge)

	if (options.excludeCredentials) {
		for (let cred of options.excludeCredentials) {
			cred.id = base64url.decode(cred.id)
		}
	}

    console.log('~ options', options)

	const cred = await navigator.credentials.create({
		publicKey: options,
	})

	console.log('~ cred', cred)

	const credential = {}
	credential.id = cred.id
	credential.rawId = base64url.encode(cred.rawId)
	credential.type = cred.type

	if (cred.response) {
		const clientDataJSON = base64url.encode(cred.response.clientDataJSON)
		const attestationObject = base64url.encode(
			cred.response.attestationObject
		)
		credential.response = {
			clientDataJSON,
			attestationObject,
		}
	}

	console.log('~ credential', credential)

	localStorage.setItem(`credId`, credential.id)

	let regRes = await postJson('/auth/register-response', credential)
	console.log('~ regRes', regRes)
	return regRes
}

export const unregisterCredential = async credId => {
	localStorage.removeItem('credId')
	return postJson(`/auth/remove-key?credId=${encodeURIComponent(credId)}`)
}

export const authenticate = async () => {
	const opts = {}

	let url = '/auth/login-request'
	const credId = localStorage.getItem(`credId`)
	if (credId) {
		url += `?credId=${encodeURIComponent(credId)}`
	}

	const options = await postJson(url, opts)

	if (options.allowCredentials.length === 0) {
		console.info('No registered credentials found.')
		return Promise.resolve(null)
	}

	options.challenge = base64url.decode(options.challenge)

	for (let cred of options.allowCredentials) {
		cred.id = base64url.decode(cred.id)
	}

	const cred = await navigator.credentials.get({
		publicKey: options,
	})

	const credential = {}
	credential.id = cred.id
	credential.type = cred.type
	credential.rawId = base64url.encode(cred.rawId)

	if (cred.response) {
		const clientDataJSON = base64url.encode(cred.response.clientDataJSON)
		const authenticatorData = base64url.encode(
			cred.response.authenticatorData
		)
		const signature = base64url.encode(cred.response.signature)
		const userHandle = base64url.encode(cred.response.userHandle)
		credential.response = {
			clientDataJSON,
			authenticatorData,
			signature,
			userHandle,
		}
	}

	return await postJson(`/auth/login-response`, credential)
}
