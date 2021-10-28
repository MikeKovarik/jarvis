import {EventEmitter} from 'events'


class Actions extends EventEmitter {

	on(...args) {
		if (args.length === 3) {
			let [actionName, deviceName, callback] = args
			let key = `${deviceName}|${actionName}`
			super.on(key, callback)
		} else {
			let [key, callback] = args
			super.on(key, callback)
		}
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