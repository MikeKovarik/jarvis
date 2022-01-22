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
	username = undefined
	credentials = []

	constructor() {
		checkBiometrics().then(val => this.hasBiometrics = val)
		this.ready = this.getInfo()
	}

	async getInfo() {
		let info = await getJson('/auth')
		this.username = info.username
		this.loggedIn = info.loggedIn
	}

	async addUsername(username) {
		try {
			await postJson('/auth/username', {username})
			this.username = username
		} catch {
			this.username = undefined
		}
	}

	loginWithPassword(password) {
		let handler = () => postJson('/auth/password', {password})
		return this.loginWrapper(handler)
	}

	loginWithBiometrics() {
		let handler = () => this.login()
		return this.loginWrapper(handler)
	}

	async loginWrapper(loginHandler) {
		this.loggingIn = true
		try {
			let user = await loginHandler()
			this._setLoggedIn(user)
		} catch(e) {
			console.error(e)
			this._setLoggedOut()
		}
		this.loggingIn = false
		return this.loggedIn
	}

	async getCredentials() {
		let {credentials} = await postJson('/auth/get-keys')
		this.credentials = credentials
		return credentials
	}

	async unregisterCredential(credId) {
		//return postJson(`/auth/remove-key/${encodeURIComponent(credId)}`)
		return postJson(`/auth/remove-key?credId=${encodeURIComponent(credId)}`)
	}

	async registerCredential() {
		let publicKey = await postJson('/auth/register-request', registerOptions)
		publicKey = revivePublicKey(publicKey)
		let cred = await navigator.credentials.create({publicKey})
		let body = packCredential(cred)
		let regRes = await postJson('/auth/register-response', body)
		return regRes
	}

	async login() {
		let publicKey = await postJson('/auth/login-request')
		// No registered credentials found
		if (publicKey.allowCredentials.length === 0) return null
		publicKey = revivePublicKey(publicKey)
		let cred = await navigator.credentials.get({publicKey})
		let body = packCredential(cred)
		return postJson('/auth/login-response', body)
	}

	async logout() {
		try {
			await getJson('/auth/logout')
			this._setLoggedOut()
		} catch {}
	}

	_setLoggedIn({username, credentials}) {
		this.loggedIn = true
		this.username = username
		this.credentials = credentials
	}

	_setLoggedOut() {
		this.loggedIn = false
		this.username = undefined
		this.credentials = []
	}

}

export const postJson = async (url, payload = '') => {
	let headers = {
		'X-Requested-With': 'XMLHttpRequest',
	}
	if (payload && !(payload instanceof FormData)) {
		headers['Content-Type'] = 'application/json'
		payload = JSON.stringify(payload)
	}
	let res = await fetch(url, {
		method: 'POST',
		credentials: 'same-origin',
		headers: headers,
		body: payload,
	})
	return await handleFetchRes(res)
}

export const getJson = async (url) => {
	let res = await fetch(url, {
		method: 'GET',
		credentials: 'same-origin',
	})
	return await handleFetchRes(res)
}

async function handleFetchRes(res) {
	if (res.status === 200) {
		return res.json()
	} else {
		let {message} = await res.json()
		throw message
	}
}

let revivePublicKey = publicKey => {
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

let packCredential = credential => {
	let data = {}
	data.id = credential.id
	data.type = credential.type
	data.rawId = base64url.encode(credential.rawId)
	if (credential.response)
		data.response = packResponseObject(credential.response)
	return data
}

let packResponseObject = response => {
	// note: cannot use Object.entries() or Object.keys() because webauthn object are weird instances.
	let out = {}
	for (let key in response) {
		let val = response[key]
		out[key] = val instanceof ArrayBuffer ? base64url.encode(val) : val
	}
	return out
}

export default new Auth