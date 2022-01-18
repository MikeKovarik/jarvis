import {authenticate, postJson} from './client.js'
import {checkBiometrics} from './util.js'


class Auth {

	loggedIn = false
	loggingIn = false

	constructor() {
		this.init()
		checkBiometrics().then(val => this.hasBiometrics = val)
	}

	async init() {
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
			let user = await authenticate()
			this.loggedIn = true
		} catch(e) {
			console.error(e)
			this.loggedIn = false
		}
		this.loggingIn = false
		return this.loggedIn
	}

}

export default new Auth