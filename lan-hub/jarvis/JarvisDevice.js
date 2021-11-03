import fetch from 'node-fetch'
import equal from 'fast-deep-equal'
import {GhomeDevice} from '../DeviceCore.js'
import {stateToActions} from '../src/ghome.js'


const hostnamePrefix = 'jarvis-iot-'

Promise.timeout = ms => new Promise((res) => setTimeout(res, ms))

const defaultHeartbeatTimeout = 1000 * 60 * 60 * 12 // 12 hours

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

	// number of milliseconds, reported by device
	heartbeatInterval = undefined
	// result of calling setTimeout with heartbeatInterval
	#heartbeatTimeout = undefined

	// needed for Google Home
	// https://developers.google.com/assistant/smarthome/reference/local/interfaces/smarthome.intentflow.deviceinfo
	deviceInfo = {
		manufacturer: 'Mike',
		model:        '',
		hwVersion:    '1.0.0',
		swVersion:    '1.0.0',
	}

	willReportState = true

	static isValidHeartbeat(data) {
		return data.id !== undefined
			&& (data.heartbeatInterval !== undefined || data.state !== undefined)
	}
/*
	static isValidHeartbeat({id, upTime, verification}) {
		return id.charCodeAt(upTime % id.length) === verification
	}
*/
	constructor(id, ip, heartbeatInterval) {
		super()
		this.id = id
		this.ip = ip
		this.heartbeatInterval = heartbeatInterval
		this.hostname = hostnamePrefix + id
		this.initialize()

		// no need to do anything about IP, GHome doesn't care about that.
		this.on('ip-change', () => console.orange(this.id, 'ip changed to', this.ip))
		this.on('state-change', () => console.cyan(this.id, 'state changed', JSON.stringify(this.state)))
		this.on('reboot', () => console.orange(this.id, 'rebooted'))
		this.on('online', () => console.green(this.id, 'is online'))
		this.on('offline', () => console.orange(this.id, 'is offline'))

		// setup this instance with possibly new device data.
		this.on('reboot', this.initialize)
		// make sure the device knows how to reach this hub once it comes online
		this.on('online', this.initialize)
	}

	destroy() {
		// TODO: remove listeners
		this.clearHeartbeatTimer()
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

	get online() {
		return this.state.online ?? false
	}

	set online(newVal = false) {
		if (this.state.online === newVal) return
		this.state.online = newVal
		this.emit(newVal ? 'online' : 'offline')
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

	// returns true if IP changed
	checkIpChange(ip) {
		if (ip === undefined) return false
		if (ip === this.ip) return false
		this.ip = ip
		this.emit('ip-change', ip)
		return true
	}

	clearHeartbeatTimer() {
		clearTimeout(this.#heartbeatTimeout)
	}

	restartHeartbeat(newInterval) {
		this.clearHeartbeatTimer()
		// Adding 5 seconds for a good measure.
		if (newInterval !== undefined && newInterval !== this.heartbeatInterval)
			this.heartbeatInterval = newInterval
		let millis = (this.heartbeatInterval || defaultHeartbeatTimeout) + 5000
		this.#heartbeatTimeout = setTimeout(() => {
			console.orange(this.id, 'heartbeat timed out')
			this.online = false
		}, millis)
		this.online = true
		this.emit('heartbeat', this.id)
	}

	// ----------------------------- 

	getUrl(path) {
		let host = this.ip || `${this.hostname}.lan`
		return `http://${host}${path}`
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
			this.restartHeartbeat()
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

	// ------------------------- COMMAND EXECUTION / STATE APPLYING -------------------------

	// shared method, accepts ghState
	applyState(ghState) {
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
		// TODO: remove this when FW supports full paths
		if (whoami.traits && whoami.traits[0].startsWith('action.devices'))
			this.traits     = whoami.traits
		else
			this.traits     = whoami.traits.map(trait => `action.devices.traits.${trait}`)
		this.attributes = whoami.attributes
		this.injectState(whoami.state)
	}

	injectState(newState) {
		// preserve online status
		let {online, ...oldState} = this.state
		if (!equal(newState, oldState)) {
			this.state = {online, ...newState}
			this.emit('state-change', this.state)
		}
		// todo: compare data, trigger change event and only then fire reportState
	}

}

function isErrorMessage(json) {
	return typeof json.message === 'string'
		&& (json.error === -1 || typeof json.code === 'number')
}
