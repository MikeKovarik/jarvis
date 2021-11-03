import fs from 'fs'
import aog from 'actions-on-google'
import {app} from '../httpServer.js'


let jwt
try {
	let jwtPath = new URL('../../secrets/ghome-key.json', import.meta.url)
	jwt = JSON.parse(fs.readFileSync(jwtPath).toString())
} catch (e) {
	console.warn('error reading service account key:', e)
	console.warn('reportState and requestSync operation will fail')
}

export const smarthome = aog.smarthome({jwt})

app.post('/smarthome', smarthome)
