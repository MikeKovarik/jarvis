import {mqtt, topics} from '../lan-hub/shared/mqtt.js'
import fetch from 'node-fetch'
import net from 'net'


//topics.on('jarvis/esp32_479934', data => console.log('* state', data))
//topics.on('foo/rpc', data => console.log('* response', data))

let device = {
	ip: '192.168.1.15',
	id: `esp32_662BE4`,
	name: 'terrace-big-lights'
}
/*
let device = {
	ip: '192.168.1.233',
	id: `esp32_479934`,
	name: 'testlight'
}
*/

class Foo {

	callRpcMethod(method, params) {
		return new Promise((resolve, reject) => {
			let reqTopic = `${device.id}/rpc`
			//let src = 'foo'
			//let resTopic = `${src}/rpc`
			//let src = 'rpc-response'
			let resTopic = `rpc-response`
			let reqId = Math.round(Math.random() * 100000000)
			let src = 'src'

			let timeout = setTimeout(() => {
				reject(`RPC ${method}:${JSON.stringify(params)} timed out`)
				topics.off(resTopic, listener)
			}, 20 * 1000)

			let listener = res => {
				if (res.id === reqId) {
					topics.off(resTopic, listener)
					resolve(res.result)
					clearTimeout(timeout)
				}
			}

			topics.on(resTopic, listener)
			let payload = {id: reqId, src, method, params}
			topics.emit(reqTopic, payload)
		})
	}

}

let foo = new Foo

const rand100 = () => Math.round(Math.random() * 100)

/*
setTimeout(() => {
	foo.callRpcMethod('whoami').then(data => console.log('RES:', data))
}, 1000)

setTimeout(() => {
	foo.callRpcMethod('action.devices.commands.BrightnessAbsolute', {brightness: rand100()}).then(data => console.log('RES:', data))
}, 1000)

setTimeout(() => {
	foo.callRpcMethod('action.devices.commands.BrightnessAbsolute', {brightness: rand100()}).then(data => console.log('RES:', data))
}, 2000)
*/


let deviceTcpCmdPort = 1610;

function sendRpcTcp(method, params) {
	return new Promise((resolve, reject) => {
		const socket = net.connect(deviceTcpCmdPort, device.ip, () => {
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

function sendHttp(method, params) {
	let url = `http://jarvis-${device.name}.lan/rpc/${method}`
	return fetch(url, {
		method: 'post',
		body: JSON.stringify(params)
	}).then(res => res.json())
}


const intervalMillis = 2000

let type = process.argv[2]
if (type === 'tcp') {
	setInterval(async () => {
		await timedPromise('sendTcp', sendTcp)
	}, intervalMillis)
} else if (type === 'rpc') {
	setInterval(async () => {
		await timedPromise('sendRpc', sendRpc)
	}, intervalMillis)
} else if (type === 'http') {
	setInterval(async () => {
		await timedPromise('httpPost', httpPost)
	}, intervalMillis)
} else {
	console.log('type not selected')
}


async function timedPromise(name, factory) {
	//console.log(name, 'RUNNING')
	let before = Date.now()
	let res = await factory()
	let after = Date.now()
    console.log('<=', res)
	let ms = ((after - before) / 1000).toFixed(1)
	console.log('DONE', ms, 's')
	return res
}

function sendTcp() {
	let val = rand100()
	console.log('=> TCP', val)
	return sendRpcTcp('action.devices.commands.BrightnessAbsolute', {brightness: val})
}

function sendRpc() {
	let val = rand100()
	console.log('=> RPC', val)
	return foo.callRpcMethod('action.devices.commands.BrightnessAbsolute', {brightness: val})
}

function httpPost() {
	let val = rand100()
	console.log('=> HTTP', val)
	return sendHttp('action.devices.commands.BrightnessAbsolute', {brightness: val})
}