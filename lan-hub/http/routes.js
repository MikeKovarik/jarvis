import {smarthome, homegraph} from '../ghome/smarthome.js'
import {OtaUploader} from '../jarvis/ota.js'
//import {Device as JarvisDevice} from '../jarvis/JarvisDevice.js'
import devices from '../shared/devices.js'
import {apiRouter} from './server.js'
import config from '../config.js'

const getDevice = idOrName => devices.getByName(idOrName)
	?? devices.getByName(`jarvis-${idOrName}`)
	?? devices.get(idOrName)

apiRouter.get('/devices/sync', async (req, res) => {
	console.gray('GET /devices/sync')
	let {agentUserId} = config
	await homegraph.devices.requestSync({requestBody: {agentUserId}})
	res.json({})
})

// Expose list of devices as JSON for debugging.
apiRouter.get('/devices', (req, res) => {
	console.gray('GET /devices')
	res.json(devices.array)
})

apiRouter.get('/devices/google', (req, res) => {
	console.gray('GET /devices/google')
	let data = devices
		.filter(device => device.willReportState)
		.map(device => device.toGoogleDevice())
	res.json(data)
})

apiRouter.get('/devices/google/all', (req, res) => {
	console.gray('GET /devices/google/all')
	res.json(devices.array.map(device => device.toGoogleDevice()))
})

apiRouter.get('/devices/:idOrName/google', (req, res) => {
	const {idOrName} = req.params
	console.gray(`GET /devices/${idOrName}/google`)
	let device = getDevice(idOrName)
	res.json(device?.toGoogleDevice() ?? {})
})

apiRouter.get('/devices/:idOrName', (req, res) => {
	const {idOrName} = req.params
	console.gray(`GET /devices/${idOrName}`)
	let device = getDevice(idOrName)
	res.json(device)
})

apiRouter.get('/devices/:idOrName/state', (req, res) => {
	const {idOrName} = req.params
	console.gray(`GET /devices/${idOrName}/state`)
	let device = getDevice(idOrName)
	res.json(device.state)
})

apiRouter.delete('/devices/:idOrName', (req, res) => {
	const {idOrName} = req.params
	console.gray(`DELETE /devices/${idOrName}`)
	devices.deleteByName(idOrName)
	devices.delete(idOrName)
	// TODO
	res.json({})
})

apiRouter.get('/devices/:idOrName/reboot', (req, res) => {
	const {idOrName} = req.params
	console.gray(`GET /devices/${idOrName}/reboot`)
	let device = getDevice(idOrName)
	if (device?.reboot) {
		device?.reboot?.()
		res.send('rebooting')
	} else {
		res.send('unable to reboot')
	}
})

apiRouter.get('/devices/:idOrName/ota', (req, res) => {
	const {idOrName} = req.params
	console.gray(`GET /devices/${idOrName}/ota`)
	let device = getDevice(idOrName)
	//if (device instanceof JarvisDevice) {
		let ota = new OtaUploader(idOrName)
		ota.run()
		res.status(200).send('updating')
	/*
	} else {
		res.status(500).send('not a jarvis device')
	}
	*/
})
