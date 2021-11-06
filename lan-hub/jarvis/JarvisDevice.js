import fetch from 'node-fetch'
import equal from 'fast-deep-equal'
import {GhomeDevice} from '../shared/DeviceCore.js'
import {stateToActions} from '../ghome/const.js'
import '../util/proto.js'
import {rootTopic} from './topics.js'


const hostnamePrefix = 'jarvis-iot-'

async function callWithExpBackoff(fn, attempt = 0, maxAttempts = 7) {
	try {
		return await fn()
	} catch(e) {
		if (attempt > maxAttempts) throw e
		await Promise.timeout(2 ** attempt * 1000)
		return callWithExpBackoff(fn, attempt + 1)
	}
}

export class Device extends GhomeDevice {

	state = {}

	// needed for Google Home
	// https://developers.google.com/assistant/smarthome/reference/local/interfaces/smarthome.intentflow.deviceinfo
	deviceInfo = {
		manufacturer: 'Mike',
		model:        '',
		hwVersion:    '1.0.0',
		swVersion:    '1.0.0',
	}

	willReportState = true

	constructor(id) {
		super()
		this.id = id
		this.hostname = hostnamePrefix + id
		this.initialize()
		// setup this instance with possibly new device data.
		this.on('reboot', this.initialize)
		// make sure the device knows how to reach this hub once it comes online
		this.on('online', this.initialize)
	}

	destroy() {
		// TODO: remove listeners
	}

	initializing = false
	initialized = false

	initialize = () => {
		if (this.initializing) return
		this.initializing = true
		callWithExpBackoff(this.initAction)
			.then(() => this.initResult(true, 'ready'))
			.catch(() => this.initResult(false, 'fail'))
	}

	initAction = async () => {
		// NOTE: whoami response contains states object. Injecting new states triggers state-change event
		// and the event handler triggers reportState(). So it's not necessary here.
		await this.fetchWhoami()
	}

	initResult(status, event) {
		this.initialized = status
		this.initializing = false
		this.emit(event)
	}

	// ----------------------------- CHECKS & SERVICING

	checkBootTime(newTime) {
		if (this.bootTime !== newTime && this.bootTime !== undefined) {
			// TODO FIRMWARE UPDATED
			this.emit('reboot')
		}
		this.bootTime = newTime
	}

	get upTime() {
		return Date.now() - this.bootTime
	}

	// ----------------------------- 

	onData(newState) {
		if (equal(this.state, newState)) return
		this.state = newState
		this.emit('state-change', this.state)
	}

	// ------------------------- COMMAND EXECUTION / STATE APPLYING -------------------------

	// shared method, accepts ghState
	executeState(ghState) {
		ghState = this.sanitizeGhState(ghState)
		let actions = stateToActions(ghState, this.traits)
		for (let action of actions)
			this.execute(action)
	}

	// TODO: rename to executeCommand?
	async execute({command, params}) {
		console.gray(this.id, 'execute()', command, params)
		let state = await this.callRpcMethod(command, params)
		if (state) this.injectState(state)
		return this.state
	}

	// ----------------------------- MQTT TOPICS

	get deviceTopic() {
		return `${rootTopic}/${this.id}`
	}

	get availabilityTopic() {
		return `${deviceTopic}/availability`
	}

	get getTopic() {
		return `${deviceTopic}/get`
	}

	// ----------------------------- 

	getUrl(path) {
		return `http://${this.hostname}.lan${path}`
	}

	getRpcUrl(method) {
		return this.getUrl(`/rpc/${method}`)
	}

	async callRpcMethod(command, data) {
		let url = this.getRpcUrl(command)
		let options = {
			method: 'POST',
			headers: {'Accept': 'application/json'}
		}
		if (data) {
			options.headers['Content-Type'] = 'application/json'
			options.body = JSON.stringify(data)
		}
		try {
			let res = await fetch(url, options)
			try {
				let json = await res.json()
				if (!isErrorMessage(json)) return json
			} catch {}
		} catch (err) {
			console.error(this.id, 'RPC method', command, 'failed')
			console.error(err.message)
			this.online = false
			throw err
		}
	}

	// ----------------------------- DIRECT HUB-TO-DEVICE COMMUNICATION APIS

	async reboot() {
		console.gray(this.id, 'reboot()')
		await this.callRpcMethod('sys.reboot')
		// http://192.168.175.171/rpc/sys.reboot
	}

	// Usually only called once, after discovering the device or on boot.
	// Contains both whoami and states to save on calling two separate requests.
	// After boot, we only ever want to know the states
	async fetchWhoami() {
		console.gray(this.id, 'fetchWhoami()')
		let whoami = await this.callRpcMethod('whoami')
		if (whoami) this.injectWhoami(whoami)
	}

	// Contains only states. Can be called anytime after boot when we don't need to knouw about devices' basic info
	async fetchState() {
		console.gray(this.id, 'fetchState()')
		let state = await this.callRpcMethod('state')
		if (state) this.injectState(state)
	}

	injectWhoami(whoami) {
		this.type       = whoami.type
		this.name       = whoami.name
		this.arch       = whoami.arch
		this.traits     = whoami.traits
		this.attributes = whoami.attributes
	}

}

function isErrorMessage(json) {
	return typeof json.message === 'string'
		&& (json.error === -1 || typeof json.code === 'number')
}
