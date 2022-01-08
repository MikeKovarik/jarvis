import {publicKeyCredentialToJSON, preformatMakeCredReq, preformatGetAssertReq} from './utils.js'
import {loadMainContainer} from './view.js'

let postJson = (url, body = {}) => {
	return fetch(url, {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	})
		.then((response) => response.json())
}

let getMakeCredentialsChallenge = (formBody, additional) => {
	return postJson(additional ? '/webauthn/add' : '/webauthn/register', formBody)
		.then((response) => {
			if(response.status !== 'ok')
				throw new Error(`Server responed with error. The message is: ${response.message}`)

			return response
		})
}

let sendWebAuthnResponse = (body) => {
	return postJson('/webauthn/response', body)
		.then((response) => {
			if(response.status !== 'ok')
				throw new Error(`Server responed with error. The message is: ${response.message}`)

			return response
		})
}

let getGetAssertionChallenge = (formBody) => {
	return postJson('/webauthn/login', formBody)
		.then((response) => {
			if(response.status !== 'ok')
				throw new Error(`Server responed with error. The message is: ${response.message}`)
			return response
		})
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
		let response3 = await sendWebAuthnResponse(makeCredResponse)
		if (response3.status === 'ok') {
			loadMainContainer()   
		} else {
			alert(`Server responed with error. The message is: ${response3.message}`)
		}
	} catch(error) {
		alert(error)
	}
}

/* Handler for login form submission */
export async function login() {
	try {
		let response1 = await getGetAssertionChallenge()
		let publicKey = preformatGetAssertReq(response1)
		let response2 = await navigator.credentials.get( { publicKey } )
		let getAssertionResponse = publicKeyCredentialToJSON(response2)
		let response3 = await sendWebAuthnResponse(getAssertionResponse)
		if (response3.status === 'ok') {
			loadMainContainer()   
		} else {
			alert(`Server responed with error. The message is: ${response3.message}`)
		}
	} catch(error) {
		alert(error)
	}
}