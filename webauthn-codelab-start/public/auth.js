import {checkBiometrics} from './util.js'


const registerOptions = {
	attestation: 'none',
	authenticatorSelection: {
		authenticatorAttachment: 'platform',
		userVerification: 'required',
		requireResidentKey: false
	}
}

class Auth {

	loggedIn = false
	loggingIn = false

	constructor() {
		checkBiometrics().then(val => this.hasBiometrics = val)
	}

	async addUsername(username) {
		return postJson('/auth/username', {username})
	}

	async loginWithPassword(password) {
		const body = {password}
		this.loggingIn = true
		try {
			await postJson('/auth/password', body)
			this.loggedIn = true
		} catch(e) {
			console.error(e)
			this.loggedIn = false
		}
		this.loggingIn = false
		return this.loggedIn
	}

	async loginWithBiometrics() {
		this.loggingIn = true
		try {
			let user = await this.login()
			this.loggedIn = true
		} catch(e) {
			console.error(e)
			this.loggedIn = false
		}
		this.loggingIn = false
		return this.loggedIn
	}

	async getCredentials() {
		const {credentials} = await postJson('/auth/get-keys')
		return credentials
	}

	async unregisterCredential(credId) {
		//return postJson(`/auth/remove-key/${encodeURIComponent(credId)}`)
		return postJson(`/auth/remove-key?credId=${encodeURIComponent(credId)}`)
	}

	async registerCredential() {
		let publicKey = await postJson('/auth/register-request', registerOptions)
		publicKey = revivePublicKey(publicKey)
		const cred = await navigator.credentials.create({publicKey})
		const body = packCredential(cred)
		let regRes = await postJson('/auth/register-response', body)
		return regRes
	}

	async login() {
		let publicKey = await postJson('/auth/login-request')
		// No registered credentials found
		if (publicKey.allowCredentials.length === 0) return null
		publicKey = revivePublicKey(publicKey)
		const cred = await navigator.credentials.get({publicKey})
		const body = packCredential(cred)
		return await postJson(`/auth/login-response`, body)
	}

}

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
		return res.json()
	} else {
		const {message} = await res.json()
		throw message
	}
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

export default new Auth