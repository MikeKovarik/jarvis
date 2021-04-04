import Mdns from 'multicast-dns'
import {EventEmitter} from 'events'
import os from 'os'
import './utils.js'
import {Device} from './Device.js'
import {app} from './server.js'
import {smarthome} from './smarthome-core.js'
import config from './config.js'


//stringlight
//growlight
//bulbstring

//const hubHostname = 'jarvis-hub'
const hubHostname = os.hostname()
const hostnamePrefix = 'jarvis-iot-'

class Devices extends Map {

	emitter = new EventEmitter

	set(key, device) {
		if (!this.has(key)) {
			this.emit('new', device)
			device.on('ready', () => this.emit('ready', device))
			device.on('fail', () => this.emit('fail', device))
		}
		super.set(key, device)
	}

	getOrCreateFromA({id, ip, hostname}) {
		if (this.has(id)) {
			return this.get(id)
		} else {
			let device = new Device(id, ip, hostname)
			this.set(id, device)
			return device
		}
	}

	getByIp(ip) {
		return this.asArray().find(device => device.ip === ip)
	}

	asArray() {
		return Array.from(this.values())
	}

	constructor() {
		super()
		const {emitter} = this
		this.emit           = emitter.emit.bind(emitter)
		this.on             = emitter.on.bind(emitter)
		this.once           = emitter.once.bind(emitter)
		this.removeListener = emitter.removeListener.bind(emitter)

		this.mdns = Mdns()
		this.mdns.on('response', res =>  {
			let isJarvis = res.answers.some(a => a.name.includes('jarvis'))
			if (isJarvis) this.parseMdnsAnswers(res.answers)
		})
	}

	parseMdnsAnswers(answers) {
		console.gray('--- MDNS', '-'.repeat(100))
		let aRecord = answers.find(a => a.type === 'A')
		if (aRecord) {
			let aData = this.parseMdnsARecord(aRecord)
			if (!this.isValidIotDevice(aData.hostname)) return
            console.gray('~ aData', JSON.stringify(aData))
			let device = this.getOrCreateFromA(aData)
			device.restartHeartbeat()
			device.checkIpChange(aData.ip)
			let txtRecord = answers.find(a => a.type === 'TXT')
			if (txtRecord) {
				let txtData = this.parseMdnsTxtRecord(txtRecord)
				device.injectMdnsTxtRecord(txtData)
			}
			//console.log(JSON.stringify(device, null, 2))
		}
	}

	parseMdnsARecord({data, name}) {
		let ip       = data
		let hostname = name.replace('.local', '').replace('.lan', '')
		let id       = hostname.slice(hostnamePrefix.length)
		return {ip, id, hostname}
	}

	isValidIotDevice(hostname) {
		return hostname.startsWith(hostnamePrefix)
			&& hostname !== hubHostname
	}

	parseMdnsTxtRecord({data}) {
		let entries = data.map(buffer => buffer.toString().split('='))
		return Object.fromEntries(entries)
	}

}

let devices = new Devices
export default devices

// Receive updates sent from device
app.post('/device-state-update', (req, res) => {
	// It's likely IPv6 app with ::ffff: IPv4 subnet prefix 
	var rawIp = req.header('x-forwarded-for') || req.connection.remoteAddress || req.ip
	let ip = sanitizeIp6AsIp4(rawIp)
	console.cyan(ip + ':', 'received on-device state change')
	res.end()
	if (Object.keys(req.body).length === 0) return
	// TODO: Security would be nice: Some challenge token from device that can be verified here.
	let messageIsVerifiedFromDevice = true
	if (!messageIsVerifiedFromDevice) return
	let device = devices.getByIp(ip)
	device.injectState(req.body)
})

function sanitizeIp6AsIp4(ip6) {
	if (ip6.startsWith('::ffff:') && ip6.includes('.'))
		return ip6.slice(7)
	else
		return ip6
}

// Expose list of devices as JSON for debugging.
app.get('/devices', (req, res) => {
	console.gray('GET /devices')
	let array = Array.from(devices.values())
	let json  = JSON.stringify(array)
	let bytes = Buffer.byteLength(json)
	res.header('Content-Length', bytes)
	res.json(array)
})

// Expose list of devices as JSON for debugging.
app.get('/request-sync', async (req, res) => {
	console.gray('GET /request-sync')
	res.json(await smarthome.requestSync(config.agentUserId))
})

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
