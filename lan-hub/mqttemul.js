import net from 'net'
import dgram from 'dgram'
import arpScan from 'local-devices'
import {topics} from './shared/mqtt.js'



const devicesAnnounceTopic = 'jarvis/hub/devices/announce';
topics.on(devicesAnnounceTopic, data => console.log('announced', data))

topics.on('jarvis/esp32_479934', data => console.log('testlight', data))
/*
topics.on('jarvis/esp32_662BE4', data => console.log('big lights', data))

setTimeout(() => {
	topics.emit('jarvis/esp32_662BE4/rpc', {
		method: 'action.devices.commands.OnOff',
		params: {
			on: false
		}
	})
}, 2000)
*/

const deviceTcpPollPort = 1609
const deviceTcpCmdPort = 1610
const deviceTcpTriggerPort = 1611

const udpBroadcastIp = '224.0.0.69'
const udpBroadcastPort = 1609

const delimeter = '␊'

const activeSockets = new Map

class IpHandler {

	static from(ip) {
		return activeSockets.get(ip)?.onHeartbeat?.() || new this(ip)
		//return activeSockets.get(ip) || new this(ip)
	}

	constructor(ip) {
		this.ip = ip
		activeSockets.set(this.ip, this)
		this.connect()
		// TODO: retry
		// TODO: will-message
	}

	connect() {
		this.pollSock = net.connect(deviceTcpPollPort, this.ip)
		this.pollSock.on('close', this.onClose)
		this.pollSock.on('error', this.onError)
		this.pollSock.on('data', this.onData)
		this.pollSock.on('connect', this.onConnect)
	}

	onConnect = () => {
		console.log(this.ip, 'conneted')
		setInterval(() => {
			console.log('sending')
			this.emit('cmd', 'onoff')
		}, 3000)
	}

	onHeartbeat() {
		//console.log(this.ip, 'MQTT-emul: heartbeat')
		return this
	}

	// -------

	dataString = ''
	dataSegments = []

	onData = buffer => {
		this.dataString += buffer.toString()
		this.parseChunks()
	}

	parseChunks() {
		this.dataSegments = this.dataString.split(delimeter)
		this.dataString = this.dataSegments.pop()
		this.dataSegments.forEach(this.handleSegmennt)
		if (this.dataString.endsWith(delimeter)) {
			this.handleSegmennt(this.dataString)
			this.dataString = ''
		}
	}

	handleSegmennt = json => {
		let data = JSON.parse(json)
		if (data.topics)
			this.onInfo(data)
		else if (data.topic)
			this.onMessage(data)
	}

	onInfo = ({topics, willTopic, willMessage}) => {
    	this.willTopic   = willTopic
    	this.willMessage = willMessage
		let newTopics = Object.keys(topics)
		this.updateTopics(newTopics)
	}

	onMessage = ({topic, message}) => {
		topics.emit(topic, message)
	}

	sendCommand(data) {
		console.log(this.ip, 'sending command')
		const tempSock = net.connect(deviceTcpCmdPort, this.ip, () => {
			let json = JSON.stringify(data)
			tempSock.on('end', () => console.log(this.ip, 'temp sock end'))
			tempSock.on('close', () => console.log(this.ip, 'temp sock close'))
			tempSock.end(json, () => console.log(this.ip, 'temp sock callback end'))
			//let buffer = Buffer.from(json)
			//tempSock.write(buffer, () => tempSock.end())
		})
	}

	emit(topic, message) {
		this.sendCommand({topic, message})
	}

	// --- other event handlers ---

	onClose = () => {
		console.log(this.ip, 'MQTT-emul: socket close')
		// TODO: retry
	}

	onError = err => {
		console.error(this.ip, 'MQTT-emul: socket failed', err)
	}

	// --- topics ---

	subscribedTopics = new Map

	updateTopics(newTopics) {
		let subscribed = Array.from(this.subscribedTopics.keys())
		let toSubscribe   = newTopics.filter(t => !subscribed.includes(t))
		let toUnsubscribe = subscribed.filter(t => !newTopics.includes(t))
		toSubscribe.forEach(this.subscribeTopic)
		toUnsubscribe.forEach(this.unsubscribeTopic)
	}

	subscribeTopic = topic => {
		let handler = message => this.emit(topic, message)
		this.subscribedTopics.set(topic, handler)
		topics.on(topic, handler)
	}

	unsubscribeTopic = topic => {
		let handler = this.subscribedTopics.get(topic)
		if (handler) {
			topics.on(topic, handler)
			this.subscribedTopics.delete(topic)
		}
	}

	sendLastWill() {
		if (this.willTopic)
			topics.emit(this.willTopic, this.willMessage)
	}

}


class MqttEmulator {

	constructor() {
		this.listenToUdpBroadcasts()
		this.runArpScan()
	}

	async runArpScan() {
		// scan on first launch to find the devices before they do their heartbeat
		//console.log('ARP: scanning')
		let ipList = await arpScan()
		//console.log('ARP: scan done')
		ipList
			.filter(d => d.name.startsWith('jarvis') || d.name === '?')
			.forEach(d => this.triggerUdpBroadcast(d.ip))
	}

	triggerUdpBroadcast(ip) {
        //console.log('triggering broadcast', ip)
		// open quick disposable connection that triggers the device to announce itself on UDP broadcast IP.
		let testSock = net.connect(deviceTcpTriggerPort, ip)
		// close the connection right after it's established.
		testSock.on('connect', () => testSock.end())
		// 4 seconds to try receive data from socket
		setTimeout(() => testSock.destroy(), 4 * 1000)
		// noop neede to prevent unhandled rejection
		testSock.on('error', () => {})
	}

	listenToUdpBroadcasts() {
		// heartbeat socket
		this.hbSocket = dgram.createSocket({type: 'udp4', reuseAddr: true})
		this.hbSocket.on('listening', this.onUdpListening)
		this.hbSocket.on('message', this.onUdpMessage)
		this.hbSocket.on('error', this.onUdpError)
		this.hbSocket.bind(udpBroadcastPort)
	}

	onUdpListening = () => {
		//let address = this.hbSocket.address()
		//console.log(`Listening for UDP broadcasts on ${address.address}:${address.port}`)
		this.hbSocket.setBroadcast(true)
		this.hbSocket.setMulticastTTL(128) 
		this.hbSocket.addMembership(udpBroadcastIp)
	}

	onUdpMessage = (buffer, remote) => {
		let ip = remote.address
		IpHandler.from(ip)
	}

	onUdpError = err => {
		console.error('UDP broadcast listener error:', err.message)
	}

}

new MqttEmulator
