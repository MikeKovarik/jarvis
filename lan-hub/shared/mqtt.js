import _mqtt from 'mqtt'
import {EventEmitter} from 'events'


//const mqttHost = 'localhost'
const mqttHost = 'jarvis-hub.lan'
const mqttPort = 1883
export const mqtt = _mqtt.connect(`mqtt://${mqttHost}:${mqttPort}`)

class Topics extends EventEmitter {

	#emitQueue = []


	constructor() {
		super()
		mqtt.on('message', this.#onMessage)
		mqtt.on('connect', this.#onConnect)
		mqtt.on('disconnect', () => console.log('MQTT disconnected'))
		mqtt.on('error', (...args) => console.error('MQTT error', ...args))
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
		console.log('MQTT connected')
		this.eventNames().map(topic => mqtt.subscribe(topic))
		for (let [topic, message] of this.#emitQueue) {
			mqtt.publish(topic, message)
		}
		this.#emitQueue.length = 0
	}

	emit(topic, message) {
		if (typeof message === 'object')
			message = JSON.stringify(message)
		if (mqtt.connected)
			mqtt.publish(topic, message)
		else
			this.#emitQueue.push([topic, message])
	}

	publish(...args) {
		this.emit(...args)
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
