import net from 'net'
import fetch from 'node-fetch'
import {GhomeDevice} from '../shared/GhomeDevice.js'
import {stateToActions} from '../ghome/const.js'
import '../util/proto.js'
import * as jTopics from './topics.js'
import {HOSTNAME_PREFIX} from '../util/util.js'
import {topics} from '../shared/mqtt.js'


const mosMqttRpcResTopic = 'rpc-response'
const deviceTcpCmdPort = 1610

export class Device extends GhomeDevice {

	willReportState = true

	// Jarvis device is only discovered by receiving message from it.
	// Unline zigbee2mqtt which stores it and its state in db.
	_online = true

	static getIdFromWhoami = whoami => whoami.id

	constructor(whoami) {
		//console.log('------------------------------')
		//console.log('new device', whoami)
		super()

		this.deviceInfo.manufacturer = 'Mike Kovarik'

		this.id = whoami.id
		this.hostname = HOSTNAME_PREFIX + this.id
		this.injectWhoami(whoami)
		this.injectState(whoami.state)
		this.subscribe()
	}

	unsubscribe() {
		if (super.unsubscribe()) {
			topics.off(this.uptimeTopic, this.injectWhoami)
			topics.off(this.ipTopic, this.injectWhoami)
		}
	}

	subscribe() {
		if (super.subscribe()) {
			topics.on(this.uptimeTopic, this.injectWhoami)
			topics.on(this.ipTopic, this.injectWhoami)
		}
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

	// ------------------------- COMMAND EXECUTION / STATE APPLYING -------------------------

	// shared method, accepts ghState
	executeState(ghState) {
		ghState = this.sanitizeGhState(ghState)
		let actions = stateToActions(ghState, this.traits)
		for (let action of actions)
			this.executeCommand(action)
	}

	// TODO: rename to executeCommand?
	async executeCommand({command, params}) {
		console.gray(this.name, 'execute', params)
		// command always returns new state
		let state = await this.callRpcMethod(command, params)
		this.injectState(state)
		return this.state
	}

	// ----------------------------- MQTT TOPICS

	get deviceTopic() {
		return `${jTopics.root}/${this.id}`
	}

	get availabilityTopic() {
		return `${this.deviceTopic}/availability`
	}

	get getTopic() {
		return `${this.deviceTopic}/get`
	}

	get uptimeTopic() {
		return `${this.deviceTopic}/uptime`
	}

	get ipTopic() {
		return `${this.deviceTopic}/ip`
	}

	// This is Mongoose OS convention: DEVICE_ID/rpc
	get rpcTopic() {
		return `${this.id}/rpc`
	}

	// ----------------------------- 

	getUrl(path) {
		if (this.ip)
			return `http://${this.ip}${path}`
		else
			return `http://${this.hostname}.lan${path}`
	}

	getRpcUrl(method) {
		return this.getUrl(`/rpc/${method}`)
	}

	callRpcMethod(method, params) {
        //console.log('callRpcMethod()', method, params)
		//return this.callRpcTcp(method, params)
		return this.callRpcMqtt(method, params)
		//return this.callRpcHttp(method, params)
	}

	callRpcTcp(method, params) {
        //console.log('callRpcTcp()', method, params)
		// TODO: get IP
		return new Promise((resolve, reject) => {
			const socket = net.connect(deviceTcpCmdPort, this.ip, () => {
				let close = () => {
					clearTimeout(timeout)
					socket.removeListener('data', onData)
					socket.removeListener('error', reject)
					socket.end()
					socket.destroy()
				}

				let timeout = setTimeout(() => {
					close()
					reject(`RPC ${method}:${JSON.stringify(params)} timed out`)
				}, 10 * 1000)

				let onData = buffer => {
					close()
					resolve(JSON.parse(buffer.toString()))
				}

				socket.on('data', onData)
				socket.on('error', reject)
				let object = {method, params}
				let json = JSON.stringify(object)
				socket.write(json)
			})
		})
	}

	callRpcMqtt(method, params) {
        //console.log('callRpcMqtt()', method, params)
		return new Promise((resolve, reject) => {
			let reqId = Math.round(Math.random() * 100000000)

			let timeout = setTimeout(() => {
				reject(`RPC ${method}:${JSON.stringify(params)} timed out`)
				topics.off(mosMqttRpcResTopic, listener)
			}, 20 * 1000)

			let listener = res => {
				if (res.id === reqId) {
					topics.off(mosMqttRpcResTopic, listener)
					resolve(res.result)
					clearTimeout(timeout)
				}
			}

			topics.on(mosMqttRpcResTopic, listener)
			let payload = {
				id: reqId,
				src: 'src',
				method,
				params
			}
			topics.emit(this.rpcTopic, payload)
		})
	}

	// works but as a fallback
	async callRpcHttp(method, params) {
		let url = this.getRpcUrl(method)
		let options = {
			method: 'POST',
			headers: {'Accept': 'application/json'}
		}
		if (params) {
			options.headers['Content-Type'] = 'application/json'
			options.body = JSON.stringify(params)
		}
		try {
			let res = await fetch(url, options)
			this.online = true
			try {
				let json = await res.json()
				if (!isErrorMessage(json)) return json
			} catch {}
		} catch (err) {
			console.error(this.id, 'RPC method', method, 'failed')
			delete err.stack
			console.error(err.message)
			this.online = false
			throw err
		}
	}

	// ----------------------------- DIRECT HUB-TO-DEVICE COMMUNICATION APIS

	async reboot() {
		console.gray(this.name, 'reboot()')
		await this.callRpcMethod('sys.reboot')
		// http://192.168.175.171/rpc/sys.reboot
	}

	// Usually only called once, after discovering the device or on boot.
	// Contains both whoami and states to save on calling two separate requests.
	// After boot, we only ever want to know the states
	async fetchWhoami() {
		console.gray(this.name, 'fetchWhoami()')
		let whoami = await this.callRpcMethod('whoami')
		if (whoami) this.injectWhoami(whoami)
	}

	// Contains only states. Can be called anytime after boot when we don't need to knouw about devices' basic info
	async fetchState() {
		console.gray(this.name, 'fetchState()')
		let state = await this.callRpcMethod('state')
		if (state) this.injectState(state)
	}

	injectWhoami = ({state, bootTime, upTime, ...rest}) => {
		Object.assign(this, rest)
		this.checkBootTime(bootTime)
		this.online = true
	}

}

function isErrorMessage(json) {
	return typeof json.message === 'string'
		&& (json.error === -1 || typeof json.code === 'number')
}
