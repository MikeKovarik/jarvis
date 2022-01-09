/* global base64 */
/* exported preformatGetAssertReq, publicKeyCredentialToJSON, preformatMakeCredReq */

/**
 * Converts PublicKeyCredential into serialised JSON
 * @param  {Object} pubKeyCred
 * @return {Object}            - JSON encoded publicKeyCredential
 */
export const publicKeyCredentialToJSON = (pubKeyCred) => {
	/* ----- DO NOT MODIFY THIS CODE ----- */
	if (pubKeyCred instanceof Array) {
		let arr = []
		for (let i of pubKeyCred)
			arr.push(publicKeyCredentialToJSON(i))

		return arr
	}

	if (pubKeyCred instanceof ArrayBuffer) {
		return base64.encode(pubKeyCred,true)
	}

	if (pubKeyCred instanceof Object) {
		let obj = {}

		for (let key in pubKeyCred) {
			obj[key] = publicKeyCredentialToJSON(pubKeyCred[key])
		}

		return obj
	}

	return pubKeyCred
}

/**
 * Decodes arrayBuffer required fields.
 */
export const preformatMakeCredReq = (makeCredReq) => {
	makeCredReq.challenge = base64.decode(makeCredReq.challenge,true)
	makeCredReq.user.id = base64.decode(makeCredReq.user.id,true)

	// Decode id of each excludeCredentials
	if (makeCredReq.excludeCredentials) {
		makeCredReq.excludeCredentials = makeCredReq.excludeCredentials.map((e) => { return { id: base64.decode(e.id, true), type: e.type }})
	}

	return makeCredReq
}

/**
 * Decodes arrayBuffer required fields.
 */
export const preformatGetAssertReq = getAssert => {
	getAssert.challenge = base64ToUint8(getAssert.challenge)
	for (let cred of getAssert.allowCredentials)
		cred.id = base64ToUint8(cred.id)
	return getAssert
}

const uint8ToBase64 = buffer => base64.encode(buffer, true)
const base64ToUint8 = string => base64.decode(string, true)