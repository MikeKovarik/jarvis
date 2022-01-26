import fs from 'fs'


const credentialsPath = './data/webauthn-credentials.json'

let data
try {
	let buffer = fs.readFileSync(credentialsPath)
	let json = buffer.toString() ?? '[]'
	data = JSON.parse(json)
} catch {
	data = []
}

export const clone = arg => JSON.parse(JSON.stringify(arg))

export const getAll = () => clone(data)

export const loadCredentials = username => {
	let credentials = data.filter(cred => cred.rpID === username)
	return {
		id: username,
		username: username,
		credentials: clone(credentials),
	}
}

export const saveCredentials = (username, {credentials}) => {
	let otherCredentials = data.filter(cred => cred.rpID !== username)
	let userCredentials = credentials.map(cred => ({...cred, rpID: username}))
	let combinedCredentials = [
		...otherCredentials,
		...userCredentials
	]
	let json = JSON.stringify(combinedCredentials, null, 4)
	data = JSON.parse(json)
	fs.writeFileSync(credentialsPath, json)
}