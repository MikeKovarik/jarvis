export default new class {

	constructor(port = 3001) {
		this.ackPhrase = 'slick-card-backend'
		this.port = port
		this.root = `${location.protocol}//${location.hostname}:${this.port}`
		this.ready = this.#try()
	}

	async #try() {
		this.connected = false
		this.connecting = true
		try {
			const res = await fetch(this.root + '/whoami')
			const text = await res.text()
			this.connected = text === this.ackPhrase
		} catch {}
		this.connecting = false
	}

	get(queryPath) {
		return fetch(this.root + queryPath, {method: 'GET'})
	}

	post(queryPath, body) {
		const headers = {}
		if (body instanceof Blob)
			headers['content-type'] = body.type
		return fetch(this.root + queryPath, {method: 'POST', headers, body})
	}

}