import {DevicesBase} from './DevicesBase.js'
import allDevices from './devices.js'


export class DedicatedDevicesBase extends DevicesBase {

	set(key, val) {
		super.set(key, val)
		allDevices.set(key, val)
	}

	delete(key) {
		super.delete(key)
		allDevices.delete(key)
	}

}
