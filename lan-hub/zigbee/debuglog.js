import * as zbTopics from './zigbee/topics.js'
import {topics} from './shared/mqtt.js'
import devices from './zigbee/devices.js'


// todo: move elsewhere
topics.on(zbTopics.bridgeEvent, data => {
	console.log('--------------------------------------')
	console.log(zbTopics.bridgeEvent)
	console.log(data)
})

setInterval(() => {
	let printable = Array.from(devices.values())
		.filter(d => d.willReportState)
		.map(d => d.toGoogleDevice())
	console.log(JSON.stringify(printable, null, 2))
}, 10000)