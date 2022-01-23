import fs from 'fs'


const credentialsPath = './data/webauthn-credentials.json'

export const defaultId = 'jarvis'
export const defaultName = 'jarvis'

let data
try {
	let buffer = fs.readFileSync(credentialsPath)
	let json = buffer.toString() ?? '[]'
	data = JSON.parse(json)
} catch {
	data = []
}

export const loadCredentials = () => {
	return {
		id: defaultId,
		username: defaultName,
		credentials: JSON.parse(JSON.stringify(data)),
	}
}

export const saveCredentials = (username, {credentials}) => {
	let json = JSON.stringify(credentials, null, 4)
	data = JSON.parse(json)
	fs.writeFileSync(credentialsPath, json)
}