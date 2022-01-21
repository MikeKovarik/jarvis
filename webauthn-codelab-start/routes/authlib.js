import fido2 from '@simplewebauthn/server'
import base64url from 'base64url'


let loadUser
let updateUser
export const setDbMethods = arg => {
	loadUser = arg.loadUser
	updateUser = arg.updateUser
}

const RP_NAME = 'WebAuthn Codelab'
const TIMEOUT = 30 * 1000 * 60

// const regParams = [-7, -35, -36, -257, -258, -259, -37, -38, -39, -8];
const regParams = [-7, -257]

export async function registerRequest(username, body) {
	const user = await loadUser(username)

	const excludeCredentials = user.credentials.map(credToPublicKeyDescriptor)

	const as = {} // authenticatorSelection
	const aa = body.authenticatorSelection.authenticatorAttachment
	const rr = body.authenticatorSelection.requireResidentKey
	const uv = body.authenticatorSelection.userVerification
	const cp = body.attestation // attestationConveyancePreference
	let asFlag = false
	let authenticatorSelection
	let attestation = 'none'

	if (aa && (aa === 'platform' || aa === 'cross-platform')) {
		asFlag = true
		as.authenticatorAttachment = aa
	}
	if (rr && typeof rr === 'boolean') {
		asFlag = true
		as.requireResidentKey = rr
	}
	if (uv && (uv === 'required' || uv === 'preferred' || uv === 'discouraged')) {
		asFlag = true
		as.userVerification = uv
	}
	if (asFlag) {
		authenticatorSelection = as
	}
	if (cp && (cp === 'none' || cp === 'indirect' || cp === 'direct')) {
		attestation = cp
	}

	const options = fido2.generateRegistrationOptions({
		rpName: RP_NAME,
		rpID: process.env.HOSTNAME,
		userID: user.id,
		userName: user.username,
		timeout: TIMEOUT,
		// Prompt users for additional information about the authenticator.
		attestationType: attestation,
		// Prevent users from re-registering existing authenticators
		excludeCredentials,
		authenticatorSelection,
	})

	// Temporary hack until SimpleWebAuthn supports `pubKeyCredParams`
	options.pubKeyCredParams = regParams.map(param => ({type: 'public-key', alg: param}))

	return options
}

export async function registerResponse(expectedChallenge, username, credential) {
	const expectedOrigin = process.env.ORIGIN
	const expectedRPID   = process.env.HOSTNAME

	const verification = await fido2.verifyRegistrationResponse({
		credential,
		expectedChallenge,
		expectedOrigin,
		expectedRPID,
	})

	const {verified, registrationInfo} = verification

	if (!verified) throw 'User verification failed.'

	const user = await loadUser(username)

	const existingCred = user.credentials.find(cred => cred.credID === credId)

	if (!existingCred) {
		// convert buffer data to http & db friendly base64 string
		let newCred = packCredential(registrationInfo)
		user.credentials.push(newCred)
	}

	await updateUser(username, user)

	return user
}

export async function loginRequest(username, userVerification = 'required') {
	const user = await loadUser(username)
	if (!user) throw 'User not found.'

	let rpID = process.env.HOSTNAME
	const allowCredentials = user.credentials.map(credToPublicKeyDescriptor)

	return fido2.generateAuthenticationOptions({
		timeout: TIMEOUT,
		rpID,
		allowCredentials,
		// This optional value controls whether or not the authenticator needs be able to uniquely
		// identify the user interacting with it (via built-in PIN pad, fingerprint scanner, etc...)
		userVerification,
	})
}

export async function loginResponse(expectedChallenge, username, body) {
    console.log('~ loginResponse')
	const expectedOrigin = process.env.ORIGIN
	const expectedRPID = process.env.HOSTNAME

	const user = await loadUser(username)

    console.log('~ body', body)
	let credential = user.credentials.find(cred => cred.credId === body.id)
    console.log('~ credential', credential)
	if (!credential) throw 'Authenticating credential not found.'

	// convert from http & db friendly base64 string to FIDO friendtly buffer data
	const authenticator = reviveCredential(credential)

	const verification = fido2.verifyAuthenticationResponse({
		credential: body,
		expectedChallenge,
		expectedOrigin,
		expectedRPID,
		authenticator,
	})

	const {verified} = verification

	if (!verified) throw 'User verification failed.'

	await updateUser(username, user)

	return user
}

function packCredential({credentialPublicKey, credentialID, counter}) {
	return {
		publicKey: base64url.encode(credentialPublicKey),
		credId:    base64url.encode(credentialID),
	}
}

function reviveCredential({publicKey, credId}) {
	return {
		credentialPublicKey: base64url.toBuffer(publicKey),
		credentialID:        base64url.toBuffer(credId),
		counter: 0,
	}
}

const credToPublicKeyDescriptor = cred => ({
	id: base64url.toBuffer(cred.credId),
	type: 'public-key',
	transports: ['internal'],
})
