import './config.js'


import(process.env.Z2M_PATH).then(module => {
	let Controller = module.default

	let controller
	let stopping = false

	async function restart() {
		await controller.stop()
		await start()
	}

	async function onExit(code) {
		process.exit(code)
	}

	async function start() {
		controller = new Controller(restart, onExit)
		await controller.start()
	}

	async function handleQuit() {
		if (!stopping && controller) {
			stopping = true
			await controller.stop()
		}
	}

	process.on('SIGINT', handleQuit)
	process.on('SIGTERM', handleQuit)
	start()

})