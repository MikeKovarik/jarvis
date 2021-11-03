import zbDevices from '../zigbee/devices.js'
import actions from '../actions.js'
import topics, {bridgeDevices, bridgeGroups} from './topics.js'
import {unique, Resolvable} from '../util/util.js'


const bindingMap = new Map

actions.on('brightness_stop', button => {
	//console.log('HOLD STOP', button.name)
	if (bindingMap.has(button.name)) {
		let lights = bindingMap.get(button.name) || []
		for (let lightName of lights) {
			console.log('FIXING', lightName, 'state')
			zbDevices.getByName(lightName)?.fetchState()
		}
	}
})

let groupsReady = new Resolvable
let devicesReady = new Resolvable

let groups = new Map

topics.on(bridgeGroups, data => {
	groups.clear()
	for (let group of data)
		groups.set(group.id, group)
	if (!groupsReady.resolved) groupsReady.resolve()
})

// get through bindings and store button->light bindings in bindingMap
topics.on(bridgeDevices, allDevices => {
	if (!devicesReady.resolved) devicesReady.resolve()
	handleLightFix(allDevices)
})

async function handleLightFix(allDevices) {
	await groupsReady
	bindingMap.clear()
	let justDevices = allDevices.filter(device => device.type !== 'Coordinator')
	let coordinator = allDevices.find(device => device.type === 'Coordinator')
	let coordinatorId = coordinator.ieee_address
	for (let source of justDevices) {
		let sourceName = source.friendly_name
		let bindings = Object.values(source.endpoints)
			.map(endpoint => endpoint.bindings).flat()
			.filter(b => b.target.ieee_address !== coordinatorId)
		for (let binding of bindings) {
			if (binding.target.type === 'group') {
				let targets = groups.get(binding.target.id)?.members ?? []
				for (let target of targets)
					handleSingleTarget(target.ieee_address, sourceName)
			} else {
				handleSingleTarget(binding.target.ieee_address, sourceName)
			}
		}
	}
}

function handleSingleTarget(targetId, sourceName) {
	let targetDevice = zbDevices.get(targetId)
	let targetName = targetDevice.name
	let items = bindingMap.get(sourceName) || []
	items.push(targetName)
	bindingMap.set(sourceName, unique(items))
}