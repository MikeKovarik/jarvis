import {spawn} from 'child_process'
import config from './config.js'


let [host, port] = config.z2m.mqtt.server.replace('mqtt://', '').split(':')

console.log('~ config.b2m', config.b2m)

let args = [
	'-m', 'TheengsGateway',
	'--host', host,
	'--log_level', 'WARNING'
]

if (config.b2m.topic)
	args.push('--pub_topic', config.b2m.topic)

if (port)
	args.push('--port', port)

if (config.b2m.scanDuration)
	args.push('--scan_duration', config.b2m.scanDuration)

if (config.b2m.timeBetween)
	args.push('--time_between', config.b2m.timeBetween)

console.log(['python', ...args].join(' '))

spawn('python', args, {stdio: 'inherit'})