import fs from 'fs'
import os from 'os'
import path from 'path'
import {fileURLToPath} from 'url'


export const __dirname = path.dirname(fileURLToPath(import.meta.url))

const {username} = os.userInfo()

export let key
export let cert

if (username === 'Mike') {
	// localhost: testing only
	key  = fs.readFileSync(path.join(__dirname, '../data/ssl.key'))
	cert = fs.readFileSync(path.join(__dirname, '../data/ssl.cert'))
} else {
	// production
	key  = fs.readFileSync(path.join(__dirname, '../../ssl.key'))
	cert = fs.readFileSync(path.join(__dirname, '../../ssl.cert'))
}

if (key === undefined || cert === undefined)
	console.error(`Certificates did not load`)
