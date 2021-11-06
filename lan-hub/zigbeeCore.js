import './util/console.js'
import './zigbee/devices.js'
import './actions.js'
import './zigbee/topics.js'
import './zigbee/ZbDevice.js'
import './triggers.js'
import './zigbee/lightfix.js'
import './zigbeeCore.js'


import {ZbDevice} from './zigbee/ZbDevice.js'
import {bridgeEvent, bridgeDevices} from './zigbee/topics.js'
import {topics} from './mqtt.js'
import devices from './zigbee/devices.js'


// todo: move elsewhere
topics.on(bridgeEvent, data => {
	console.log('--------------------------------------')
	console.log(bridgeEvent)
	console.log(data)
})

// todo: move elsewhere
topics.on(bridgeDevices, allDevices => {
	let _devices = allDevices.filter(device => device.type !== 'Coordinator')
	for (let device of _devices) 
		ZbDevice.from(device)
})


setInterval(() => {
	let printable = Array.from(devices.values())
		.filter(d => d.willReportState)
		.map(d => d.toGoogleDevice())
	console.log(JSON.stringify(printable, null, 2))
}, 10000)