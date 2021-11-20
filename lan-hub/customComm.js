import net from 'net'
import dgram from 'dgram'

/*
let deviceUdpPort = 1609
let deviceTcpPort = 1610

var broadcastIp = '224.0.0.69'
var broadcastPort = 1609

const delimeter = '␊'

let activeSockets = new Set

function handleIp(targetIp) {
	const socket = net.connect(deviceTcpPort, targetIp, () => {
		console.log('TCP connected to targetIp')
		socket.on('end', () => console.log('TCP socket end'))
		socket.on('close', () => console.log('TCP socket close'))
		socket.on('timeout', () => console.log('TCP socket timeout'))
		socket.on('connect', () => console.log('TCP socket connect'))

		let chunks = ''

		function parseChunks() {
			let items = chunks.split(delimeter)
			chunks = items.pop()
			items.forEach(handleJson)
			if (chunks.endsWith(delimeter)) {
				handleJson(chunks)
				chunks = ''
			}
		}

		function handleJson(json) {
			let {topic, data} = JSON.parse(json)
			console.log('----------')
			console.log('topic', topic)
			console.log('data', data)
		}

		socket.on('data', buffer => {
			chunks += buffer.toString()
			parseChunks()
		})
	})
}

//handleIp('192.168.1.235')

const onUdpMessage = (buffer, remote) => {
	let ip = remote.address
	let json = buffer.toString()
	console.log('onUdpMessage', ip, json)
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


const tcpServer = net.createServer(c => {
	// 'connection' listener.
	console.log('tcp client connected')
	c.on('data', buffer => {
		console.log('tcp data:', buffer.toString())
	})
	c.on('end', () => {
		console.log('tcp client disconnected')
	})
})
tcpServer.on('error', (err) => {
	console.log('tcp error', err)
})
tcpServer.listen(8081, () => {
  console.log('tcpServer listening')
})