import {publicKeyCredentialToJSON, preformatMakeCredReq, preformatGetAssertReq, postJson} from './utils.js'
import {loadMainContainer} from './view.js'

let getMakeCredentialsChallenge = async body => {
	let response = await postJson('/webauthn/register', body)
	return preformatMakeCredReq(response)
}

let getGetAssertionChallenge = async body => {
	let response = await postJson('/webauthn/login', body)
	return preformatGetAssertReq(response)
}

let sendWebAuthnResponse = raw => {
	let json = publicKeyCredentialToJSON(raw)
	return postJson('/webauthn/response', json)
}

export async function register(username) {
	let name = username
	let publicKey = await getMakeCredentialsChallenge({username, name})
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