import {EventEmitter} from 'events'


const getKey = (deviceName, actionName) => `${deviceName}|${actionName}`

class Actions extends EventEmitter {

	on(...args) {
		if (args.length === 3) {
			let [actionName, deviceName, callback] = args
			let key = getKey(deviceName, actionName)
			super.on(key, callback)
		} else {
			super.on(...args)
		}
	}

	removeListener(...args) {
		if (args.length === 3) {
			let [actionName, deviceName, callback] = args
			let key = getKey(deviceName, actionName)
			super.removeListener(key, callback)
		} else {
			super.removeListener(...args)
		}
	}

	off(...args) {
		this.removeListener(...args)
	}

	emit(actionName, device) {
		if (device) {
			let key = `${device.name}|${actionName}`
			super.emit(key, device)
		}
		super.emit(actionName, device)
	}

}

const actions = new Actions
export default actions