import {EventEmitter} from 'events'


export class DevicesBase extends Map {

	emitter = new EventEmitter

	constructor() {
		super()
		const {emitter} = this
		this.emit           = emitter.emit.bind(emitter)
		this.on             = emitter.on.bind(emitter)
		this.once           = emitter.once.bind(emitter)
		this.removeListener = emitter.removeListener.bind(emitter)
	}

	set(id, device) {
		if (!this.has(id)) {
			this.emit('new', device)
		}
		super.set(id, device)
	}

	delete(id) {
		let device = this.get(id)
		if (device) device.destroy()
		super.delete(id)
	}

	get array() {
		return Array.from(this.values())
	}

	getByName = name => this.array.find(d => d.name === name)

	_onDevice = whoami => {
		let {Device} = this.constructor
		let id = Device.getIdFromWhoami(whoami)
		if (this.has(id)) {
			let device = this.get(id)
			device.injectWhoami(whoami)
		} else {
			let device = Device.from?.(whoami) ?? new Device(whoami)
			this.set(id, device)
		}
	}

}