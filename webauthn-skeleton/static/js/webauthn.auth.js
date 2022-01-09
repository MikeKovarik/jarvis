import {publicKeyCredentialToJSON, preformatMakeCredReq, preformatGetAssertReq} from './utils.js'
import {loadMainContainer} from './view.js'

let postJson = async (url, body = {}) => {
	let response = await fetch(url, {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	})
	let {status, message, ...data} = await response.json()
	if (status !== 'ok')
		throw new Error(`Server responed with error. The message is: ${message}`)
	return data
}

let getMakeCredentialsChallenge = (formBody, additional) => {
	return postJson(additional ? '/webauthn/add' : '/webauthn/register', formBody)
}

let sendWebAuthnResponse = (body) => {
	return postJson('/webauthn/response', body)
}

let getGetAssertionChallenge = async (formBody) => {
	let response = await postJson('/webauthn/login', formBody)
	return preformatGetAssertReq(response)
}

/* Handle for register form submission */
export async function register(username, additional) {
	let name = username
	try {
		let response1 = await getMakeCredentialsChallenge({username, name}, additional)
        console.log('~ response1', response1)
		let publicKey = preformatMakeCredReq(response1)
		let response2 = await navigator.credentials.create({ publicKey })
        console.log('~ response2.response.attestationObject', response2.response.attestationObject)
		let makeCredResponse = {
			id: response2.id,
			rawId: base64.encode(response2.rawId,true),
			response: {
				attestationObject: base64.encode(response2.response.attestationObject,true),
				clientDataJSON: base64.encode(response2.response.clientDataJSON,true)
			},
			type: response2.type
		}
		await sendWebAuthnResponse(makeCredResponse)
		loadMainContainer()   
	} catch(error) {
		alert(error)
	}
}

/* Handler for login form submission */
export async function login() {
	try {
		let publicKey = await getGetAssertionChallenge()
        console.log('~ publicKey', publicKey)
		let response2 = await navigator.credentials.get({publicKey})
		let getAssertionResponse = publicKeyCredentialToJSON(response2)
		await sendWebAuthnResponse(getAssertionResponse)
		loadMainContainer()   
	} catch(error) {
		alert(error)
	}
}