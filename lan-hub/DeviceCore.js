import {EventEmitter} from 'events'
import './util/console.js'
//import {smarthome} from './smarthome-core.js'
import config from './config.js'
import {TRAITS} from './ghome/const.js'


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
		// notify google about offline state
		this.on('offline', this.reportState)
		this.on('online', this.reportState)
		this.on('state-change', this.reportState)
	}

	// Debounce locks and dedupes reportState() method calls made immediately, multiple times.
	// NOTE: Google home tends to send multiple requests instead of sending a batch.
	// i.e. Turning on a light at 70% brigthness does two separate requests (OnOff & BrightnessAbsolute)
	// each of which triggers reportState. Not only is it redundant, but the first call could arrive
	// with delay, causing old data to win over actual state.
	reportState = async () => {
		if (this.initialized)
	        console.gray(this.id, 'reporting state')
		else
	        return console.gray(this.id, 'not reporting state, device not initialized')
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
			console.error(this.id, 'error reporting device states to homegraph:', errorResponse)
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
