import {DevicesBase} from '../shared/DevicesBase.js'
import {Device as JarvisDevice} from './JarvisDevice.js'
import {topics} from '../shared/mqtt.js'
import * as jTopics from './topics.js'


class Devices extends DevicesBase {

	static Device = JarvisDevice

	constructor() {
		super()
		topics.on(jTopics.devicesAnnounce, this._onDevice)
		topics.emit(jTopics.devicesScan) // todo

		// LOGGING
		this.on('new', device => {
			console.green('new device discovered:', device.id, device.name)
		})
	}

}

let devices = new Devices
export default devices
