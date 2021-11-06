import fs from 'fs'
import {createProxyServer} from 'lan-tunnel'
import os from 'os'
import path from 'path'
import {fileURLToPath} from 'url'


const __dirname = path.dirname(fileURLToPath(import.meta.url))

const {username} = os.userInfo()

let key, cert
if (username === 'Mike') {
	// localhost: testing only
	key  = fs.readFileSync(path.join(__dirname, '../data/ssl.key'))
	cert = fs.readFileSync(path.join(__dirname, '../data/ssl.cert'))
} else if (username === 'Mike') {
	// production
	key  = fs.readFileSync(path.join(__dirname, '../ssl.key'))
	cert = fs.readFileSync(path.join(__dirname, '../ssl.cert'))
}

const config = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/config.json')))

createProxyServer({
	log: true,
	key,
	cert,
	...config,
})