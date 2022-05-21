import {spawn} from 'child_process'
import {exposeThroughProxy} from 'lan-tunnel'
import config from './config.js'


const process = spawn('hass', [], {stdio: 'inherit'})

process.once('close', code => process.exit(code))
process.once('exit', code => process.exit(code))
/*
exposeThroughProxy({
	log: true,
	...config,
	...config['proxy-hass'],
})
*/