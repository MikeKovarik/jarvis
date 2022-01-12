import {publicKeyCredentialToJSON, registrationCredFromJson, loginAssertFromJson, postJson} from './utils.js'
import {loadMainContainer} from './view.js'

let getMakeCredentialsChallenge = async body => {
	let json = await postJson('/webauthn/register', body)
	return registrationCredFromJson(json)
}

let getGetAssertionChallenge = async body => {
	let json = await postJson('/webauthn/login', body)
	return loginAssertFromJson(json)
}

let sendWebAuthnResponse = raw => {
	let json = publicKeyCredentialToJSON(raw)
	return postJson('/webauthn/response', json)
}

export async function register(name) {
	let publicKey = await getMakeCredentialsChallenge({name})
	let credential = await navigator.credentials.create({publicKey})
	await sendWebAuthnResponse(credential)
	loadMainContainer()
}

export async function login() {
	let publicKey = await getGetAssertionChallenge()
	let credential = await navigator.credentials.get({publicKey})
	await sendWebAuthnResponse(credential)
	loadMainContainer()
}