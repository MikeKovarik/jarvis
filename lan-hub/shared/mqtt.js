import _mqtt from 'mqtt'
import {EventEmitter} from 'events'


const port = 1883
export const mqtt = _mqtt.connect(`mqtt://localhost:${port}`)

class Topics extends EventEmitter {

	constructor() {
		super()
		mqtt.on('message', this.#onMessage)
		mqtt.on('connect', this.#onConnect)
	}

	#onMessage = (topic, message) => {
		let data
		try {
			data = JSON.parse(message.toString())
		} catch {
			data = message.toString()
		}
		super.emit(topic, data)
	}

	#onConnect = () => {
		this.eventNames().map(topic => mqtt.subscribe(topic))
	}

	emit(...args) {
		console.log('TODO: emit to MQTT')
		super.emit(...args)
	}

	on(...args) {
		let [topic] = args
		let listeners = this.listeners(topic)
		if (listeners.length === 0) {
		// TODO: only subscribe events once MQTT is connected
			mqtt.subscribe(topic, err => {
				if (err) console.error(`failed subscribing to ${topic}`)
			})
		}
		if (args.length > 1) {
			super.on(...args)
		}
	}

	off(...args) {
		if (args.length > 1) {
			super.removeListener(...args)
		}
		let [topic] = args
		let listeners = this.listeners(topic)
		if (listeners.length === 0) {
		// TODO: only subscribe events once MQTT is connected
			mqtt.unsubscribe(topic, err => {
				if (err) console.error(`failed subscribing to ${topic}`)
			})
		}
	}

}

export const topics = new Topics
