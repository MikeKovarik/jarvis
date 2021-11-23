import _mqtt from 'mqtt'
import {EventEmitter} from 'events'
import config from '../config.js'


export const mqtt = _mqtt.connect(config.z2m.mqtt.server)

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
		this.eventNames().forEach(topic => mqtt.subscribe(topic))
		for (let [topic, message] of this.#emitQueue)
			mqtt.publish(topic, message)
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

	on(topic, cb) {
		if (mqtt.connected && this.listeners(topic).length === 0) {
			mqtt.subscribe(topic, err => {
				if (err) console.error(`failed subscribing to ${topic}`)
			})
		}
		super.on(topic, cb)
	}

	off(topic, cb) {
		super.removeListener(topic, cb)
		if (mqtt.connected && this.listeners(topic).length === 0) {
			mqtt.unsubscribe(topic, err => {
				if (err) console.error(`failed unsubscribing from ${topic}`)
			})
		}
	}

}

export const topics = new Topics

// Here to prevent MaxListenersExceededWarning because every device listens to same topics (like rename)
// This sets arbitrary limit at 100 devices for now.
topics.setMaxListeners(100)