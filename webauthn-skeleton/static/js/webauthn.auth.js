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
export function register (username, additional) {
    
	let name = username

	getMakeCredentialsChallenge({username, name}, additional)
		.then((response) => {
			let publicKey = preformatMakeCredReq(response)
			return navigator.credentials.create({ publicKey })
		})
		.then((response) => {
			let makeCredResponse = {
				id: response.id,
				rawId: base64.encode(response.rawId,true),
				response: {
					attestationObject: base64.encode(response.response.attestationObject,true),
					clientDataJSON: base64.encode(response.response.clientDataJSON,true)
				},
				type: response.type
			}
			return sendWebAuthnResponse(makeCredResponse)
		})
		.then((response) => {
			if(response.status === 'ok') {
				loadMainContainer()   
			} else {
				alert(`Server responed with error. The message is: ${response.message}`)
			}
		})
		.catch((error) => alert(error))
}

/* Handler for login form submission */
export function login() {
	getGetAssertionChallenge()
		.then((response) => {
            console.log('~ response 1', response)
			let publicKey = preformatGetAssertReq(response)
            console.log('~ publicKey', publicKey)
			return navigator.credentials.get( { publicKey } )
		})
		.then((response) => {
            console.log('~ response 2', response)
			let getAssertionResponse = publicKeyCredentialToJSON(response)
            console.log('~ getAssertionResponse', getAssertionResponse)
			return sendWebAuthnResponse(getAssertionResponse)
		})
		.then((response) => {
            console.log('~ response 3', response)
			if(response.status === 'ok') {
				loadMainContainer()   
			} else {
				alert(`Server responed with error. The message is: ${response.message}`)
			}
		})
		.catch((error) => alert(error))
}