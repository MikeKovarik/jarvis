import mqtt from 'mqtt'


const mqttHost = 'jarvis-hub.lan'
const mqttPort = 1883
export const mqttClient  = mqtt.connect(`mqtt://${mqttHost}:${mqttPort}`)

const announceDeviceTopic = 'jarvis/hub/devices/announce'
const devicesTopic = 'jarvis/hub/devices'
const deviceTopic = 'jarvis/esp32_479934'
const availabilityTopic = 'jarvis/esp32_479934/availability'

mqttClient.on('connect', function () {
	console.log('on mqtt connect')
	mqttClient.subscribe(announceDeviceTopic)
	mqttClient.subscribe(devicesTopic)
	mqttClient.subscribe(deviceTopic)
	mqttClient.subscribe(availabilityTopic)
})

mqttClient.on('message', (topic, message) => {
	console.log(topic, message.toString())

	if (topic === announceDeviceTopic)
		handleNewDevice(message)
})

let devices = []

function handleNewDevice(message) {
	let data = JSON.parse(message.toString())
	devices.push(data)
	mqttClient.publish(devicesTopic, JSON.stringify(devices))
}