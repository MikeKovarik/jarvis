import equal from 'fast-deep-equal'
import {EventEmitter} from 'events'
import './util/console.js'
//import smarthome from './smarthome.js'
import config from './config.js'
import {TRAITS} from './ghome/const.js'
import {topics} from './mqtt.js'


Promise.timeout = ms => new Promise((res) => setTimeout(res, ms))

function getKeys(ctx) {
	let set = new Set([
		...Object.keys(ctx),
		...Object.keys(Object.getOwnPropertyDescriptors(ctx.constructor.prototype)),
	])
	set.delete('constructor')
	set.delete('toJSON')
	set.delete('valueOf')
	return Array.from(set)
}

export class GhomeDevice extends EventEmitter {

	traits = []
	attributes = {}

	constructor() {
		super()
		this.on('reboot', () => console.orange(this.id, this.name, 'rebooted'))
		this.on('online', () => console.green(this.id, this.name, 'is online'))
		this.on('offline', () => console.orange(this.id, this.name, 'is offline'))
		// notify google about offline state
		this.on('offline', this.reportState)
		this.on('online', this.reportState)
		this.on('state-change', this.reportState)
		// binding here and not with fat arrow due to inheritance
		this.onData = this.onData.bind(this)
	}

	destroy() {
		// TODO: remove listeners
		this.unsubscribe()
		this.removeAllListeners()
	}

	// MQTT SUBSCRIPTIONS -----------------------------

	_subscribed = false

	unsubscribe() {
		if (!this._subscribed) return
		topics.off(this.deviceTopic, this.onData)
		topics.off(this.availabilityTopic, this.onAvailability)
		this._subscribed = false
	}

	subscribe() {
		if (this._subscribed) return
		topics.on(this.deviceTopic, this.onData)
		topics.on(this.availabilityTopic, this.onAvailability)
		this._subscribed = true
	}

	// STATE -----------------------------

	#state = {}

	onData(val) {
		let {linkquality, update, action, ...state} = val
		let newState = {...this.#state, ...state}
		this.injectState(newState)
	}

	//injectState(newState = {}) {
	injectState({online, ...newState} = {}) {
		if (!equal(this.#state, newState)) {
			this.#state = newState
			this.emit('state-change', this.state)
		}
	}

	// needed by Zigbee device
	translateStateToGh() {
		return this.#state
	}

	get state() {
		return {
			...this.translateStateToGh(this.#state),
			online: this.#online
		}
	}

	// ONLINE -----------------------------

	#online = false

	onAvailability = val => {
		this.online = val === 'online'
	}

	get online() {
		return this.#online
	}

	set online(newVal = false) {
		if (this.#online === newVal) return
		this.#online = newVal
		this.emit(newVal ? 'online' : 'offline')
		//this.emit('state-change', this.state)
	}

	// GHOME REPORTING -----------------------------

	// Debounce locks and dedupes reportState() method calls made immediately, multiple times.
	// NOTE: Google home tends to send multiple requests instead of sending a batch.
	// i.e. Turning on a light at 70% brigthness does two separate requests (OnOff & BrightnessAbsolute)
	// each of which triggers reportState. Not only is it redundant, but the first call could arrive
	// with delay, causing old data to win over actual state.
	reportState = async () => {
	    console.gray(this.id, this.name, this.#state)
		if (this.initialized)
	        console.gray(this.id, this.name, 'reporting state')
		else
	        return console.gray(this.id, this.name, 'not reporting state, device not initialized')
		try {
			let res = await smarthome.reportState({
				agentUserId: config.agentUserId,
				requestId: Math.random().toString(),
				payload: {
					devices: {
						states: {
							[this.id]: this.state,
						},
					},
				},
			})
			return JSON.parse(res)
		} catch (e) {
			const errorResponse = JSON.parse(e)
			console.error(this.id, this.name, 'error reporting device states to homegraph:', errorResponse)
		}
	}

	// ----------------------------- INPUT DATA FORMATTING

	sanitizeGhState(arg) {
		let ghState = {}
		let type = typeof arg
		if (type === 'number' && this.traits.includes(TRAITS.Brightness))
			ghState.brightness = arg
		else if (type === 'boolean' && this.traits.includes(TRAITS.OnOff))
			ghState.on = arg
		else if (type === 'object')
			ghState = {...ghState, ...arg}
		else
			throw new Error(`Incorrect arg`, arg)
		if (ghState.brightness === 0) {
			ghState.state = false
			delete ghState.brightness
		}
		return ghState
	}

	// ----------------------------- OUTPUT DATA FORMATTING

	// ?? remove
	toString() {
		const {id, name, type, traits} = this
		return {id, name, type, traits}
	}

	toGoogleDevice() {
		return {
			id:         this.id,
			type:       this.type,
			traits:     this.traits,
			attributes: this.attributes,
			name: {
				name:         this.name,
				defaultNames: [this.name],
				nicknames:    [this.name],
			},
			deviceInfo: this.deviceInfo,
			willReportState: this.willReportState,
		}
	}

	toJSON() {
		let output = {}
		let keys = getKeys(this)
		for (let key of keys) {
			let val = this[key]
			if (key.startsWith('_')) continue
			if (typeof val === 'function') continue
			output[key] = val
		}
		return output
	}

}
