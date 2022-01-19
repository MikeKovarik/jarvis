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

const registerOptions = {
	attestation: 'none',
	authenticatorSelection: {
		authenticatorAttachment: 'platform',
		userVerification: 'required',
		requireResidentKey: false
	}
}

export const registerCredential = async () => {
	let publicKey = await postJson('/auth/register-request', registerOptions)
	publicKey = revivePublicKey(publicKey)
	const cred = await navigator.credentials.create({publicKey})
	const body = packCredential(cred)
	let regRes = await postJson('/auth/register-response', body)
	return regRes
}

export const unregisterCredential = async credId => {
	return postJson(`/auth/remove-key?credId=${encodeURIComponent(credId)}`)
}

export const authenticate = async () => {
	let publicKey = await postJson('/auth/login-request')
	// No registered credentials found
	if (publicKey.allowCredentials.length === 0) return null
	publicKey = revivePublicKey(publicKey)
	const cred = await navigator.credentials.get({publicKey})
	const body = packCredential(cred)
	return await postJson(`/auth/login-response`, body)
}

const revivePublicKey = publicKey => {
	publicKey.challenge = base64url.decode(publicKey.challenge)

	if (publicKey.user?.id)
		publicKey.user.id = base64url.decode(publicKey.user.id)

	if (publicKey.excludeCredentials)
		for (let cred of publicKey.excludeCredentials)
			cred.id = base64url.decode(cred.id)

	if (publicKey.allowCredentials)
		for (let cred of publicKey.allowCredentials)
			cred.id = base64url.decode(cred.id)

	return publicKey
}

const packCredential = credential => {
	const data = {}
	data.id = credential.id
	data.type = credential.type
	data.rawId = base64url.encode(credential.rawId)
	if (credential.response)
		data.response = packResponseObject(credential.response)
	return data
}

const packResponseObject = response => {
	// note: cannot use Object.entries() or Object.keys() because webauthn object are weird instances.
	let out = {}
	for (let key in response) {
		let val = response[key]
		out[key] = val instanceof ArrayBuffer ? base64url.encode(val) : val
	}
	return out
}