import devices from './devices.js'

devices.parseMdnsAnswers([
	{"name":"_services._dns-sd._udp.local","type":"PTR","ttl":4500,"class":"IN","flush":false,"data":"_http._tcp.local"},
	{"name":"_http._tcp.local","type":"PTR","ttl":4500,"class":"IN","flush":false,"data":"jarvis-iot-growlight._http._tcp.local"},
	{"name":"jarvis-iot-growlight._http._tcp.local","type":"SRV","ttl":120,"class":"IN","flush":true,"data":{"priority":0,"weight":0,"port":80,"target":"jarvis-iot-growlight.local"}},
	{"name":"jarvis-iot-growlight._http._tcp.local","type":"TXT","ttl":120,"class":"IN","flush":true,"data":[
		Buffer.from([105,100,61,103,114,111,119,108,105,103,104,116]),
		Buffer.from([97,114,99,104,61,101,115,112,56,50,54,54]),
		Buffer.from([97,112,112,61,105,111,116,45,102,105,114,109,119,97,114,101]),
		Buffer.from([102,119,95,118,101,114,115,105,111,110,61,49,46,48]),
		Buffer.from([102,119,95,105,100,61,50,48,50,49,48,51,49,56,45,50,48,52,48,53,55]),
		Buffer.from([104,101,97,114,116,98,101,97,116,73,110,116,101,114,118,97,108,61,51,54,48,48,48,48,48]),
	]},
	{"name":"jarvis-iot-growlight.local","type":"A","ttl":120,"class":"IN","flush":true,"data":"192.168.175.233"},
	{"name":"jarvis-iot-growlight.local","type":"NSEC","ttl":120,"class":"IN","flush":true,"data":
		Buffer.from([20,106,97,114,118,105,115,45,105,111,116,45,103,114,111,119,108,105,103,104,116,5,108,111,99,97,108,0,0,1,64])
	}
])
/*
setTimeout(() => {
	let device = devices.get('growlight')
    console.log('~ device', device)
	device.callCommand({
		command: 'action.devices.commands.OnOff',
		params: {on: true}
	})
	device.callCommand({
		command: 'action.devices.commands.ColorAbsolute',
		params: {"color": {"spectrumRGB": 0xFF0000}}
	})
}, 200)
*/



/*
createDevice({
	type: 'LIGHT',
	id: 'stringlight',
	name: `String light`,
	traits: ['OnOff'],
}, {
	online: true,
	on: false,
})

createDevice({
	type: 'LIGHT',
	id: 'growlight',
	name: `Grow light`,
	traits: ['Brightness', 'OnOff', 'ColorSetting'],
	attributes: {
		colorModel: 'rgb',
	},
}, {
	online: true,
	on: false,
	brightness: 100,
	color: {
		//spectrumRGB: 4915330,
		//spectrumRGB: 0x000000,
		spectrumRGB: 0xFF00FF,
	},
})
function createDevice(...args) {
	let device = new Device
	device.injectTestData(...args)
	devices.set(device.id, device)
}
*/