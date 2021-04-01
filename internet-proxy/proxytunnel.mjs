import fs from 'fs'
import {createProxyServer} from 'lan-tunnel'


createProxyServer({
	log: true,
	key:  fs.readFileSync('../ssl.key'),
	cert: fs.readFileSync('../ssl.cert'),
	...JSON.parse(fs.readFileSync('../secrets/tunnel.json')),
	//proxyPort: 1609,
	//tunnelPort: 8010,
})