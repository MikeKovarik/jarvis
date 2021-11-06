// https://developers.google.com/assistant/smarthome/develop/process-intents
import devices from '../jarvis/devices.js'
import config from '../config.js'
import aog from 'actions-on-google'
import {app} from '../http/server.js'
import {getAbsolutePath, readJson} from '../util/util.js'
import '../util/proto.js'


const jwtPath = getAbsolutePath(import.meta.url, '../../data/ghome-key.json')
const jwt = readJson(jwtPath)
const smarthome = aog.smarthome({jwt})

export default smarthome

app.post('/smarthome', smarthome)


export let connected = false

//smarthome.requestSync()

const smarthomeHandler = payloadCreator => {
	return async body => {
		connected = true
		return {
			requestId: body.requestId,
			payload: payloadCreator(body)
		}
	}
}

smarthome.onSync(smarthomeHandler(async body => ({
	agentUserId: config.agentUserId,
	devices: await handleSync(body)
})))

smarthome.onQuery(async body => ({
	devices: await handleQuery(body.inputs[0].payload),
}))

smarthome.onExecute(async body => ({
	commands: await handleExecute(body.inputs[0].payload)
}))

smarthome.onDisconnect(async body => {
	connected = false
	return {}
})

function handleSync(body) {
	console.gray('--- SMARTHOME: SYNC', '-'.repeat(100))
	return devices.array.map(device => device.toGoogleDevice())
}

async function handleQuery(payload) {
	console.gray('--- SMARTHOME: QUERY', '-'.repeat(100))
	//console.gray(JSON.stringify(payload.devices, null, 2))
	console.gray('devices:', payload.devices.map(d => d.id))
	
	const response = {}
	await Promise.all(payload.devices.map(async ({id}) => {
		let device = devices.get(id)
		if (device) {
			response[id] = {
				...device.state,
				status: 'SUCCESS',
			}
		} else {
			response[id] = {
				status: 'ERROR',
				errorCode: 'deviceOffline',
			}
		}
	}))
	return response
}

async function handleExecute(payload) {
	console.gray('--- SMARTHOME: EXECUTE', '-'.repeat(100))
	//console.gray(JSON.stringify(payload.commands, null, 2))

	// execution is array of actions, not just a single one.
	return payload.commands
		.map(cmd => cmd.devices.map(async ({id}) => {
			let device = devices.get(id)
			try {
				if (device?.online) {
					await cmd.execution
						.map(exe => device.execute(exe))
						.promiseAll()
					return createExecuteCommandSuccess(device)
				} else {
					return createExecuteCommandOffline({id})
				}
			} catch (e) {
				return createExecuteCommandError({id}, e)
			}
		}))
		.flat()
		.promiseAll()
}


function createExecuteCommandSuccess(device) {
	return {
		ids: [device.id],
		status: 'SUCCESS',
		states: device.state
	}
}

function createExecuteCommandErrorBase(device, errorCode, additional = {}) {
	return {
		ids: [device.id],
		status: 'ERROR',
		errorCode,
		...additional
	}
}

function createExecuteCommandOffline(device) {
	return createExecuteCommandErrorBase(device, 'deviceOffline')
}

function createExecuteCommandError(device, e) {
	if (e.message === 'pinNeeded') {
		return createExecuteCommandErrorBase(device, 'challengeNeeded', {
			challengeNeeded: {
				type: 'pinNeeded',
			}
		})
	} else if (e.message === 'challengeFailedPinNeeded') {
		return createExecuteCommandErrorBase(device, 'challengeNeeded', {
			challengeNeeded: {
				type: 'challengeFailedPinNeeded',
			},
		})
	} else if (e.message === 'ackNeeded') {
		return createExecuteCommandErrorBase(device, 'challengeNeeded', {
			challengeNeeded: {
				type: 'ackNeeded',
			},
		})
	} else if (e.message === 'PENDING') {
		return {
			ids: [device.id],
			status: 'PENDING',
		}
	} else {
		return createExecuteCommandErrorBase(device, e.message)
	}
}
