import fs from 'fs'

export let tunnelConfig
try {
	let path = new URL('../secrets/tunnel.json', import.meta.url)
	let buffer = fs.readFileSync(path)
	tunnelConfig = JSON.parse(buffer.toString())
} catch {
	console.log(`Error parsing tunnel config`)
}

export const agentUserId = 'USER_ID_1'