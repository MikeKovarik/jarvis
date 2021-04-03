import fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'


const __dirname = path.dirname(fileURLToPath(import.meta.url))

export let config
try {
	let configPath = path.join(__dirname, '../secrets/config.json')
	let buffer = fs.readFileSync(configPath)
	config = JSON.parse(buffer.toString())
} catch(err) {
    console.error('~ err', err)
	console.error(`Error parsing tunnel config`)
}

export default config