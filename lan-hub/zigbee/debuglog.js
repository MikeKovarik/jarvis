import * as zbTopics from './topics.js'
import {topics} from '../shared/mqtt.js'
import devices from './devices.js'


// todo: move elsewhere
topics.on(zbTopics.bridgeEvent, data => {
	console.log('--------------------------------------')
	console.log(zbTopics.bridgeEvent)
	console.log(data)
})