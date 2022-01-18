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

	let publicKey = await postJson('/auth/register-request', opts)
	publicKey = reviveRegisterPublicKey(publicKey)
    console.log('~ publicKey', publicKey)
	const cred = await navigator.credentials.create({publicKey})
	console.log('~ cred', cred)
	const body = packRegisterCredential(cred)
	console.log('~ body', body)
	let regRes = await postJson('/auth/register-response', body)
	console.log('~ regRes', regRes)
	return regRes
}

export const unregisterCredential = async credId => {
	return postJson(`/auth/remove-key?credId=${encodeURIComponent(credId)}`)
}

export const authenticate = async () => {
	console.log('authenticate 1')
	let publicKey = await postJson('/auth/login-request')
	// No registered credentials found
	if (publicKey.allowCredentials.length === 0) return null
	publicKey = reviveLoginPublicKey(publicKey)
    console.log('~ publicKey', publicKey)
	const cred = await navigator.credentials.get({publicKey})
    console.log('~ cred', cred)
	const body = packLoginCredential(cred)
    console.log('~ body', body)
	return await postJson(`/auth/login-response`, body)
}

const reviveRegisterPublicKey = publicKey => {
	publicKey.user.id = base64url.decode(publicKey.user.id)
	publicKey.challenge = base64url.decode(publicKey.challenge)
	if (publicKey.excludeCredentials)
		for (let cred of publicKey.excludeCredentials)
			cred.id = base64url.decode(cred.id)
	return publicKey
}

const reviveLoginPublicKey = publicKey => {
	publicKey.challenge = base64url.decode(publicKey.challenge)
	for (let cred of publicKey.allowCredentials)
		cred.id = base64url.decode(cred.id)
	return publicKey
}

const packRegisterCredential = credential => {
	const data = {}
	data.id = credential.id
	data.type = credential.type
	data.rawId = base64url.encode(credential.rawId)

	if (credential.response) {
		data.response = {
			clientDataJSON: base64url.encode(credential.response.clientDataJSON),
			attestationObject: base64url.encode(credential.response.attestationObject),
		}
	}

	return data
}

const packLoginCredential = credential => {
	const data = {}
	data.id = credential.id
	data.type = credential.type
	data.rawId = base64url.encode(credential.rawId)

	if (credential.response) {
		data.response = {
			clientDataJSON: base64url.encode(credential.response.clientDataJSON),
			authenticatorData: base64url.encode(credential.response.authenticatorData),
			signature: base64url.encode(credential.response.signature),
			userHandle: base64url.encode(credential.response.userHandle),
		}
	}

	return data
}