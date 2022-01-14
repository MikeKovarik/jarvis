export const _fetch = async (path, payload = '') => {
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

	const options = await _fetch('/auth/registerRequest', opts)
    console.log('~ options', options)

	options.user.id = base64url.decode(options.user.id)
	options.challenge = base64url.decode(options.challenge)

	if (options.excludeCredentials) {
		for (let cred of options.excludeCredentials) {
			cred.id = base64url.decode(cred.id)
		}
	}

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

	let regRes = await _fetch('/auth/registerResponse', credential)
    console.log('~ regRes', regRes)
	return regRes
}

export const unregisterCredential = async credId => {
	localStorage.removeItem('credId')
	return _fetch(`/auth/removeKey?credId=${encodeURIComponent(credId)}`)
}
