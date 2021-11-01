import mqtt from 'mqtt'
import {EventEmitter} from 'events'
import {ZbDevice} from './ZbDevice.js'


const mqttPort = 1883
export const mqttClient  = mqtt.connect(`mqtt://localhost:${mqttPort}`)

export const bridgeRootTopic = 'zigbee2mqtt'
export const bridgeEvent    = `${bridgeRootTopic}/bridge/event`
export const bridgeDevices  = `${bridgeRootTopic}/bridge/devices`
export const bridgeGroups   = `${bridgeRootTopic}/bridge/groups`
export const renameResponse = `${bridgeRootTopic}/bridge/response/device/rename`
// 'default_bind_group'



class Topics extends EventEmitter {

	on(...args) {
		let [topic] = args
		let listeners = this.listeners(topic)
		if (listeners.length === 0) {
			mqttClient.subscribe(topic, err => {
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
			mqttClient.unsubscribe(topic, err => {
				if (err) console.error(`failed subscribing to ${topic}`)
			})
		}
	}

}

const topics = new Topics


mqttClient.on('connect', function () {
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

mqttClient.on('message', (topic, message) => {
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