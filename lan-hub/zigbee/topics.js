import {EventEmitter} from 'events'
import {ZbDevice} from '../ZbDevice.js'
import mqtt from '../mqtt.js'


export const bridgeRootTopic = 'zigbee2mqtt'
export const bridgeEvent    = `${bridgeRootTopic}/bridge/event`
export const bridgeDevices  = `${bridgeRootTopic}/bridge/devices`
export const bridgeGroups   = `${bridgeRootTopic}/bridge/groups`
export const renameResponse = `${bridgeRootTopic}/bridge/response/device/rename`


class Topics extends EventEmitter {

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

const topics = new Topics


mqtt.on('connect', function () {
	console.log('on mqtt connect')
	const eventList = [
		bridgeEvent,
		bridgeDevices,
		bridgeGroups,
		renameResponse,
	]
	for (let eventName of eventList) {
		topics.on(eventName)
	}
})

mqtt.on('message', (topic, message) => {
	let data
	try {
		data = JSON.parse(message.toString())
	} catch {
		data = message.toString()
	}
	topics.emit(topic, data)
})

topics.on(bridgeEvent, data => {
	console.log('--------------------------------------')
	console.log(bridgeEvent)
	console.log(data)
})

topics.on(bridgeDevices, allDevices => {
	let _devices = allDevices.filter(device => device.type !== 'Coordinator')
	for (let device of _devices) 
		ZbDevice.from(device)
})

export default topics