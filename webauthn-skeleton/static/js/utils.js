export const publicKeyCredentialToJSON = cred => {
	if (cred instanceof Array)       return reviveArrayPublicKey(cred)
	if (cred instanceof ArrayBuffer) return reviveBufferPublicKey(cred)
	if (cred instanceof Object)      return reviveObjectPublicKey(cred)
	return cred
}

function reviveArrayPublicKey(arr) {
	return arr.map(publicKeyCredentialToJSON)
}

function reviveBufferPublicKey(cred) {
	return uint8ToBase64(cred)
}

function reviveObjectPublicKey(input) {
	let output = {}
	for (let key in input)
		output[key] = publicKeyCredentialToJSON(input[key])
	return output
}

export const registrationCredFromJson = (makeCredReq) => {
	makeCredReq.challenge = base64ToUint8(makeCredReq.challenge)
	makeCredReq.user.id = base64ToUint8(makeCredReq.user.id)
	if (makeCredReq.excludeCredentials)
		makeCredReq.excludeCredentials = makeCredReq.excludeCredentials.map(reviveCred)
	return makeCredReq
}

const reviveCred = cred => ({
	id: base64ToUint8(cred.id),
	type: cred.type
})

export const loginAssertFromJson = getAssert => {
	getAssert.challenge = base64ToUint8(getAssert.challenge)
	for (let cred of getAssert.allowCredentials)
		cred.id = base64ToUint8(cred.id)
	return getAssert
}

const uint8ToBase64 = buffer => base64.encode(buffer, true)
const base64ToUint8 = string => base64.decode(string, true)


export async function postJson(url, body = {}) {
	let res = await fetch(url, {
		method: 'POST',
		credentials: 'include',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	})
	return handleResponse(res)
}

// todo remove in favor of getJsonSimple
export async function getJson(url) {
	let res = await fetch(url, {credentials: 'include'})
	return handleResponse(res)
}

export async function getJsonSimple(url) {
	let res = await fetch(url, {credentials: 'include'})
	return res.json()
}

async function handleResponse(res) {
	let contentLength = res.headers.get('content-length')
	if (contentLength > 0) {
		let {status, message, ...data} = (await res.json()) ?? {status: 'ok'}
		if (status !== 'ok')
			throw new Error(message)
		return data
	}
}
