import {DevicesBase} from '../shared/DevicesBase.js'
import {ZbDevice} from './ZbDevice.js'
import {topics} from '../shared/mqtt.js'
import * as zbTopics from './topics.js'


class Devices extends DevicesBase {

	static Device = ZbDevice

	constructor() {
		super()
		topics.on(zbTopics.devices, this._onDevices)
	}

	_onDevices = allDevices => {
		allDevices
			.filter(device => device.type !== 'Coordinator')
			.forEach(this._onDevice)
	}

}

const devices = new Devices
export default devices