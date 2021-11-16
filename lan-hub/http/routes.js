import smarthome from '../ghome/smarthome.js'
import {OtaUploader} from '../jarvis/ota.js'
//import {Device as JarvisDevice} from '../jarvis/JarvisDevice.js'
import devices from '../shared/devices.js'
import {apiRouter} from './server.js'
import config from '../config.js'

// Expose list of devices as JSON for debugging.
apiRouter.get('/devices', (req, res) => {
	console.gray('GET /devices')
	let array = devices.array
	let json  = JSON.stringify(array)
	let bytes = Buffer.byteLength(json)
	res.header('Content-Length', bytes)
	res.json(array)
})

apiRouter.get('/devices/:deviceName', (req, res) => {
	const {deviceName} = req.params
	console.gray(`GET /devices/${deviceName}`)
	let device = devices.getByName(deviceName)
	res.json(device.toGoogleDevice())
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

apiRouter.get('/ghome-sync', async (req, res) => {
	console.gray('GET /devices/ghome-sync')
	res.json(await smarthome.requestSync(config.agentUserId))
})
