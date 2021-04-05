import {EventEmitter} from 'events'
import os from 'os'
import dgram from 'dgram'
import {Device} from './Device.js'
import {app} from './server.js'
import {smarthome} from './smarthome-core.js'
import config from './config.js'


const hubHostname = os.hostname()
const hostnamePrefix = 'jarvis-iot-'

var UDP_BROADCAST_IP = '230.185.192.108'
var UDP_BROADCAST_PORT = 1609

class Devices extends Map {

	emitter = new EventEmitter

	constructor() {
		super()
		const {emitter} = this
		this.emit           = emitter.emit.bind(emitter)
		this.on             = emitter.on.bind(emitter)
		this.once           = emitter.once.bind(emitter)
		this.removeListener = emitter.removeListener.bind(emitter)
		this.listenUdpBroadcasts()
	}

	listenUdpBroadcasts() {
		let udpSocket = dgram.createSocket({type: 'udp4', reuseAddr: true})
		udpSocket.on('listening', () => {
			var address = udpSocket.address()
			console.log(`Listening for UDP broadcasts on ${address.address}:${address.port}`)
			udpSocket.setBroadcast(true)
			udpSocket.setMulticastTTL(128) 
			udpSocket.addMembership(UDP_BROADCAST_IP)
		})
		udpSocket.on('error', err => console.error('UDP broadcast listener error:', err.message))
		udpSocket.on('message', this.onUdpMessage)
		udpSocket.bind(UDP_BROADCAST_PORT)
	}

	onUdpMessage = (buffer, remote) => {
		let ip = remote.address
		let json = buffer.toString()
		try {
			let data = JSON.parse(json)
			if (Device.isValidDevice(data))
				this.onUdpDiscovery(ip, data)
			else
				console.error(`Invalid UDP device found ${ip}`, data)
		} catch(err) {
			console.error(`Invalid UDP message received ${ip}`, err, json)
		}
	}

	onUdpDiscovery(ip, {id, bootTime, heartbeatInterval}) {
		console.cyan(id, 'heartbeat received')
		if (this.has(id)) {
			let device = this.get(id)
			device.checkIpChange(ip)
			device.checkBootTime(bootTime)
			device.restartHeartbeat(heartbeatInterval)
		} else {
			let device = new Device(id, ip, heartbeatInterval)
			this.set(id, device)
		}
	}

	set(key, device) {
		if (!this.has(key)) {
			this.emit('new', device)
			device.on('ready', () => this.emit('ready', device))
			device.on('fail', () => this.emit('fail', device))
		}
		super.set(key, device)
	}

	getByIp(ip) {
		return this.asArray().find(device => device.ip === ip)
	}

	asArray() {
		return Array.from(this.values())
	}

	isValidIotDevice(hostname) {
		return hostname.startsWith(hostnamePrefix)
			&& hostname !== hubHostname
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
