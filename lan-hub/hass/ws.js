import WebSocket from 'ws'
import * as hassWs from 'home-assistant-js-websocket'
import config from '../config.js'


global.WebSocket = WebSocket


const auth = hassWs.createLongLivedTokenAuth(process.env.HASS_URL, config.hassToken)

export let connected = false
export let connection

init()

async function init() {
	console.log('HASS WS: connecting')
	connection = await hassWs.createConnection({auth})
	connected = true
	console.log('HASS WS: connected')

	connection.addEventListener('ready', () => connected = true)
	connection.addEventListener('disconnected', () => connected = false)
	connection.addEventListener('reconnect-error', () => connected = false)

	connection.addEventListener('ready', () => console.log('HASS WS: ready'))
	connection.addEventListener('disconnected', () => console.log('HASS WS: disconnected'))
	connection.addEventListener('reconnect-error', () => console.log('HASS WS: reconnect-error'))
}

export const callService = (...arg) => hassWs.callService(connection, ...arg)

