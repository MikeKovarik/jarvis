import net from 'net'
import dgram from 'dgram'
import arpScan from 'local-devices'
import {topics} from './shared/mqtt.js'


let pollPort = 1609
let emitPort = 1610

var broadcastIp = '224.0.0.69'
var broadcastPort = 1609

const helloToken = 'JARVIS'
const delimeter = '␊'

const devicesAnnounceTopic = 'jarvis/hub/devices/announce';
const devicesScanTopic     = 'jarvis/hub/devices/scan';

let activeSockets = new Map

class IpHandler {

	static from(ip) {
		return activeSockets.get(ip) || new this(ip)
	}

	verified = false
	valid = false

	constructor(ip) {
		this.ip = ip
		activeSockets.set(this.ip, this)
		this.connect()
		// TODO: retry
		// TODO: will-message
	}

	connect() {
		this.pollSock = net.connect(pollPort, this.ip)
		this.pollSock.on('close', this.onClose)
		this.pollSock.on('error', this.onError)
		this.pollSock.on('data', this.onData)
		//this.pollSock.on('connect', this.onConnect)
	}

	verifyConnection() {
		if (this.verified) return
		if (this.rawString.length >= helloToken.length) {
			this.verified = true
			this.valid = this.rawString.startsWith(helloToken)
			if (this.valid)
				this.rawString = this.rawString.slice((helloToken + delimeter).length)
			else
				this.invalidateDevice()
		}
	}

	invalidateDevice() {
		activeSockets.delete(this.ip)
		this.pollSock?.destroy()
	}

	// -------

	rawString = ''
	chunks = []

	onData = buffer => {
		this.rawString += buffer.toString()
		this.verifyConnection()
        console.log('this.valid', this.valid)
		if (this.valid) this.parseChunks()
	}

	parseChunks() {
		this.chunks = this.rawString.split(delimeter)
		this.rawString = this.chunks.pop()
		this.chunks.forEach(this.onJson)
		if (this.rawString.endsWith(delimeter)) {
			this.onJson(this.rawString)
			this.rawString = ''
		}
	}

	onJson = json => {
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
		const tempSock = net.connect(emitPort, this.ip, () => {
			let json = JSON.stringify(data)
			let buffer = Buffer.from(json)
			tempSock.write(buffer)
		})
	}

	emit(topic, message) {
		this.sendCommand({topic, message})
	}

	// --- other event handlers ---

	onClose = () => {
		// Skip logging connections we've initiated after ARPing the network to try find all devices.
		// This error is most likely just ECONNREFUSED
		if (!this.valid) return
		console.log(this.ip, 'MQTT-emul socket close')
		// TODO: retry
	}

	onError = err => {
		// Skip logging connections we've initiated after ARPing the network to try find all devices.
		// This error is most likely just ECONNREFUSED
		if (!this.valid) return
		console.error(this.ip, 'MQTT-emul socket failed', err)
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



async function main() {
	// scan on first launch to find the devices before they do their heartbeat
	console.log('ARP: scanning')
	let ipList = await arpScan()
	console.log('ARP: scan done')
	ipList
		.filter(d => d.name.startsWith('jarvis') || d.name === '?')
		.forEach(d => IpHandler.from(d.ip))
}

main()

//handleIp('192.168.1.235')
//IpHandler.from('192.168.1.233')

topics.on(devicesAnnounceTopic, data => console.log('announced', data))
/*
topics.on(devicesScanTopic, () => console.log('starting scan!'))
setTimeout(() => {
	topics.emit(devicesScanTopic)
}, 2000)
*/


/*
const onUdpMessage = (buffer, remote) => {
	let ip = remote.address
	let json = buffer.toString()
	console.log('onUdpMessage', ip, json, buffer.toString())
	if (!activeSockets.has(ip))
		handleIp(ip)
}

// heartbeat socket
let hbSocket = dgram.createSocket({type: 'udp4', reuseAddr: true})
hbSocket.on('listening', () => {
	var address = hbSocket.address()
	console.log(`Listening for UDP broadcasts on ${address.address}:${address.port}`)
	hbSocket.setBroadcast(true)
	hbSocket.setMulticastTTL(128) 
	hbSocket.addMembership(broadcastIp)
})
hbSocket.on('error', err => console.error('UDP broadcast listener error:', err.message))
hbSocket.on('message', onUdpMessage)
hbSocket.bind(broadcastPort)
*/



/*
var sock = dgram.createSocket("udp4");

sock.bind(function() {
    sock.setBroadcast(true);
    setInterval(broadcastNew, 3000);
});

function broadcastNew() {
    var message = Buffer.from("HEY!");
    sock.send(message, 0, message.length, broadcastPort, broadcastIp, function() {
        console.log("Sent '" + message + "'");
    });
}
*/