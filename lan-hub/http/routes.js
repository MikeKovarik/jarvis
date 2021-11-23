import {smarthome, homegraph} from '../ghome/smarthome.js'
import {OtaUploader} from '../jarvis/ota.js'
//import {Device as JarvisDevice} from '../jarvis/JarvisDevice.js'
import devices from '../shared/devices.js'
import {apiRouter} from './server.js'
import config from '../config.js'

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

apiRouter.get('/devices/:deviceName/google', (req, res) => {
	const {deviceName} = req.params
	console.gray(`GET /devices/${deviceName}/google`)
	let device = devices.getByName(deviceName)
	res.json(device.toGoogleDevice())
})

apiRouter.get('/devices/:deviceName', (req, res) => {
	const {deviceName} = req.params
	console.gray(`GET /devices/${deviceName}`)
	let device = devices.getByName(deviceName)
	res.json(device)
})

apiRouter.get('/devices/:deviceName/state', (req, res) => {
	const {deviceName} = req.params
	console.gray(`GET /devices/${deviceName}/state`)
	let device = devices.getByName(deviceName)
	res.json(device.state)
})

apiRouter.delete('/devices/:deviceName', (req, res) => {
	const {deviceName} = req.params
	console.gray(`DELETE /devices/${deviceName}`)
	devices.deleteByName(deviceName)
	// TODO
	res.json({})
})

apiRouter.get('/devices/:deviceName/reboot', (req, res) => {
	const {deviceName} = req.params
	console.gray(`GET /devices/${deviceName}/reboot`)
	let device = devices.getByName(deviceName)
	if (device?.reboot) {
		device?.reboot?.()
		res.send('rebooting')
	} else {
		res.send('unable to reboot')
	}
})

apiRouter.get('/devices/:deviceName/ota', (req, res) => {
	const {deviceName} = req.params
	console.gray(`GET /devices/${deviceName}/ota`)
	let device = devices.getByName(deviceName)
	//if (device instanceof JarvisDevice) {
		let ota = new OtaUploader(deviceName)
		ota.run()
		res.status(200).send('updating')
	/*
	} else {
		res.status(500).send('not a jarvis device')
	}
	*/
})
