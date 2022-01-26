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
	credentials = []

	constructor() {
		checkBiometrics().then(val => this.hasBiometrics = val)
		this.ready = this.getInfo()
	}

	async getInfo() {
		let info = await api.get('/auth')
		this.loggedIn = info.loggedIn
	}

	loginWithPassword(password) {
		let handler = () => api.post('/auth/password', {password})
		return this.loginWrapper(handler)
	}

	loginWithBiometrics() {
		let handler = () => this.login()
		return this.loginWrapper(handler)
	}

	async loginWrapper(loginHandler) {
		this.loggingIn = true
		try {
			await loginHandler()
			this._setLoggedIn()
		} catch(e) {
			console.error(e)
			this._setLoggedOut()
		}
		this.loggingIn = false
		return this.loggedIn
	}

	async getCredentials() {
		return this.credentials = await api.get('/auth/credentials')
	}

	async unregisterCredential(credId) {
		return api.delete(`/auth/credentials/${encodeURIComponent(credId)}`)
	}

	async registerCredential(name) {
		let publicKey = await api.post('/auth/register-request', registerOptions)
		publicKey = revivePublicKey(publicKey)
		let credential = await navigator.credentials.create({publicKey})
		credential = packCredential(credential)
		credential.name = name
		await api.post('/auth/register-response', credential)
	}

	async login() {
		let publicKey = await api.post('/auth/login-request')
		publicKey = revivePublicKey(publicKey)
		if (publicKey.allowCredentials.length === 0)
			return console.error(`No credentials to log in with`)
		let cred = await navigator.credentials.get({publicKey})
		let body = packCredential(cred)
		await api.post('/auth/login-response', body)
	}

	async logout() {
		try {
			await api.get('/auth/logout')
			this._setLoggedOut()
		} catch {}
	}

	_setLoggedIn() {
		this.loggedIn = true
	}

	_setLoggedOut() {
		this.loggedIn = false
		this.credentials = []
	}

}

export const customFetch = async (url, method, body, headers = {}) => {
	headers['X-Requested-With'] = 'XMLHttpRequest'
	if (body && !(body instanceof FormData)) {
		headers['Content-Type'] = 'application/json'
		body = JSON.stringify(body)
	}
	let res = await fetch(url, {
		method,
		credentials: 'same-origin',
		headers,
		body,
	})
	if (res.status === 200) {
		let type = res.headers.get('content-type') ?? ''
		return type.includes('application/json')
			? res.json()
			: res.text()
	} else {
		let {message} = await res.json()
		throw message
	}
}

export const api = {
	post: async (url, body = '') => customFetch(url, 'POST', body),
	get: async url => customFetch(url, 'GET'),
	delete: async url => customFetch(url, 'DELETE'),
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