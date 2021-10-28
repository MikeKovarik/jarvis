import devices from './devices.mjs'
import actions from './actions.mjs'
import topics, {bridgeDevices} from './topics.mjs'


const unique = arr => Array.from(new Set(arr))
const bindingMap = new Map
//const bindingMap = new Map([['big-button-1', ['bulb-kitchen']]])

actions.on('brightness_stop', button => {
	//console.log('HOLD STOP', button.name)
	if (bindingMap.has(button.name)) {
		let lights = bindingMap.get(button.name) || []
		for (let lightName of lights) {
			console.log('FIXING', lightName, 'state')
			devices.getByName(lightName)?.fetchState()
		}
	}
})

// get through bindings and store button->light bindings in bindingMap
topics.on(bridgeDevices, allDevices => {
	let justDevices = allDevices.filter(device => device.type !== 'Coordinator')
	let coordinator = allDevices.find(device => device.type === 'Coordinator')
	let coordinatorId = coordinator.ieee_address
	for (let device of justDevices) {
		//let sourceId   = device.ieee_address
		let sourceName = device.friendly_name
		let bindings = Object.values(device.endpoints)
			.map(endpoint => endpoint.bindings).flat()
			.filter(b => b.target.ieee_address !== coordinatorId)
		for (let binding of bindings) {
			if (binding.target.type === 'group') {
				// TODO
			} else {
				let targetDevice = devices.get(binding.target.ieee_address)
				//let targetId   = binding.target.ieee_address
				let targetName = targetDevice.name
				let items = bindingMap.get(sourceName) || []
				items.push(targetName)
				bindingMap.set(sourceName, unique(items))
			}
		}
	}
})