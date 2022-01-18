import {authenticate, postJson} from './client.js'
import {checkBiometrics} from './util.js'


class Auth {

	loggedIn = false

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
		try {
			await postJson('/auth/password', body)
			this.loggedIn = true
		} catch(e) {
			console.error(e)
			this.loggedIn = false
		}
		return this.loggedIn
	}

	async loginWithBiometrics() {
		try {
			let user = await authenticate()
			this.loggedIn = true
		} catch(e) {
			console.error(e)
			this.loggedIn = false
		}
		return this.loggedIn
	}

}

export default new Auth