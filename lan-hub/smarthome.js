// https://developers.google.com/assistant/smarthome/develop/process-intents
import devices from './devices.js'
import config from './config.js'
import {smarthome} from './smarthome-core.js'


export {smarthome}

export let connected = false

//smarthome.requestSync()

smarthome.onSync(async body => {
	connected = true
	return {
		requestId: body.requestId,
		payload: {
			agentUserId: config.agentUserId,
			devices: await handleSync(body)
		}
	}
})

smarthome.onQuery(async body => {
	connected = true
	return {
		requestId: body.requestId,
		payload: {
			devices: await handleQuery(body.inputs[0].payload),
		},
	}
})

smarthome.onExecute(async body => {
	connected = true
	return {
		requestId: body.requestId,
		payload: {
			commands: await handleExecute(body.inputs[0].payload)
		},
	}
})

function handleSync(body) {
	console.gray('--- SMARTHOME: SYNC', '-'.repeat(100))
	return devices.asArray().map(device => device.toGoogleDevice())
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
				...device.states,
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
				if (device) {
					await cmd.execution
						.map(exe => device.execute(exe))
						.promiseAll()
					//await device.reportState()
					return createExecuteCommandSuccess(device)
				} else {
					return createExecuteCommandOffline({id})
				}
			} catch (e) {
				console.error('error returned by execution on store device document', e)
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
		states: device.states
	}
}

function createExecuteCommandOffline(device) {
	return {
		ids: [device.id],
		status: 'ERROR',
		errorCode: 'deviceOffline',
	}
}

function createExecuteCommandError(device, e) {
	if (e.message === 'pinNeeded') {
		return {
			ids: [device.id],
			status: 'ERROR',
			errorCode: 'challengeNeeded',
			challengeNeeded: {
				type: 'pinNeeded',
			}
		}
	} else if (e.message === 'challengeFailedPinNeeded') {
		return {
			ids: [device.id],
			status: 'ERROR',
			errorCode: 'challengeNeeded',
			challengeNeeded: {
				type: 'challengeFailedPinNeeded',
			},
		}
	} else if (e.message === 'ackNeeded') {
		return {
			ids: [device.id],
			status: 'ERROR',
			errorCode: 'challengeNeeded',
			challengeNeeded: {
				type: 'ackNeeded',
			},
		}
	} else if (e.message === 'PENDING') {
		return {
			ids: [device.id],
			status: 'PENDING',
		}
	} else {
		return {
			ids: [device.id],
			status: 'ERROR',
			errorCode: e.message,
		}
	}
}

smarthome.onDisconnect(async body => {
	connected = false
	return {}
})

Array.prototype.promiseAll = function() {
	return Promise.all(this)
}