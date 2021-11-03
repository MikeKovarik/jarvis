import {EventEmitter} from 'events'
import mqtt from '../mqtt.js'


export class Topics extends EventEmitter {

	on(...args) {
		let [topic] = args
		let listeners = this.listeners(topic)
		if (listeners.length === 0) {
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
			let [topic] = args
			mqtt.unsubscribe(topic, err => {
				if (err) console.error(`failed subscribing to ${topic}`)
			})
		}
	}

}
