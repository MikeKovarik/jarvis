import './ghome/smarthome.js'

// Expose list of devices as JSON for debugging.
apiRouter.get('/devices', (req, res) => {
	console.gray('GET /devices')
	let array = Array.from(devices.values())
	let json  = JSON.stringify(array)
	let bytes = Buffer.byteLength(json)
	res.header('Content-Length', bytes)
	res.json(array)
})

apiRouter.get('/ghome-sync', async (req, res) => {
	console.gray('GET /request-sync')
	res.json(await smarthome.requestSync(config.agentUserId))
})
