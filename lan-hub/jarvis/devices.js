import {EventEmitter} from 'events'
import {Device} from './JarvisDevice.js'


class Devices extends Map {

	emitter = new EventEmitter

	constructor() {
		super()
		const {emitter} = this
		this.emit           = emitter.emit.bind(emitter)
		this.on             = emitter.on.bind(emitter)
		this.once           = emitter.once.bind(emitter)
		this.removeListener = emitter.removeListener.bind(emitter)
	}

	onUdpDiscovery({id, bootTime, state}) {
		let device
		if (this.has(id)) {
			device = this.get(id)
			if (bootTime !== undefined)
				device.checkBootTime(bootTime)
		} else {
			device = new Device(id)
			this.set(id, device)
		}
		if (state !== undefined)
			device.injectState(state)
	}

	set(id, device) {
		if (!this.has(id)) {
			this.emit('new', device)
			device.on('ready', () => this.emit('ready', device))
			device.on('fail', () => this.emit('fail', device))
		}
		super.set(id, device)
	}

	delete(id) {
		let device = this.get(id)
		if (device) device.destroy()
		super.delete(id)
	}

	getByIp(ip) {
		return this.array.find(device => device.ip === ip)
	}

	getByName(name) {
		return this.array.find(device => device.name === name)
	}

	get array() {
		return Array.from(this.values())
	}

}

let devices = new Devices
export default devices

// LOGGING
devices.on('new', device => {
	console.green('new device discovered:', device.id, device.ip)
})

devices.on('ready', device => {
	console.green('new device ready:', device.id, device.ip)
	console.gray(JSON.stringify(device, null, 2))
})

devices.on('fail', device => {
	console.error('device initialization failed:', device.id, device.ip)
	console.gray(JSON.stringify(device, null, 2))
})
