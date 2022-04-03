import {createProxyServer} from 'lan-tunnel'
import {config, __dirname, key, cert} from './shared.mjs'


createProxyServer({
	log: true,
	key,
	cert,
	...config['proxy-hub'],
})