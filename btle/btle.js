//var noble = require('noble')
const noble = require('noble-winrt')

var serviceUUIDs = []
var allowDuplicates = false

noble.startScanning(serviceUUIDs, allowDuplicates, console.error)

noble.on('stateChange', () => console.log('stateChange'))
noble.on('scanStart', () => console.log('scanStart'))
noble.on('scanStop', () => console.log('scanStop'))
//noble.on('discover', device => console.log(JSON.stringify(device, null, 2)))
noble.on('discover', device)
noble.on('warning', console.log)

setTimeout(() => {
	console.log('stopping')
	noble.stopScanning()
}, 20 * 1000)

/*
;(async () => {
	const { createBluetooth } = require('node-ble')
	const { bluetooth, destroy } = createBluetooth()
	const adapter = await bluetooth.defaultAdapter()

	if (!(await adapter.isDiscovering())) await adapter.startDiscovery()
})()

setTimeout(async () => {
	await device.disconnect()
	destroy()
}, 10 * 1000)

*/
