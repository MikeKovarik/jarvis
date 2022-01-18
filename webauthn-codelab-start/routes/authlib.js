import fido2 from '@simplewebauthn/server'
import base64url from 'base64url'
import low from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync.js'


const adapter = new FileSync('./data/webauthn.json')
export const db = low(adapter)

db.defaults({
	users: [],
}).write()

const RP_NAME = 'WebAuthn Codelab'
const TIMEOUT = 30 * 1000 * 60


export async function registerRequest(username, body) {
	const user = db.get('users')
		.find({username})
		.value()

	const excludeCredentials = []
	if (user.credentials.length > 0) {
		for (let cred of user.credentials) {
			excludeCredentials.push({
				id: base64url.toBuffer(cred.credId),
				type: 'public-key',
				transports: ['internal'],
			})
		}
	}

	const pubKeyCredParams = []
	// const params = [-7, -35, -36, -257, -258, -259, -37, -38, -39, -8];
	const params = [-7, -257]
	for (let param of params) {
		pubKeyCredParams.push({type: 'public-key', alg: param})
	}

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
	options.pubKeyCredParams = []
	for (let param of params) {
		options.pubKeyCredParams.push({type: 'public-key', alg: param})
	}

	return options
}

export async function registerResponse(expectedChallenge, username, body) {
	const expectedOrigin = process.env.ORIGIN
	const expectedRPID = process.env.HOSTNAME

	const verification = await fido2.verifyRegistrationResponse({
		credential: body,
		expectedChallenge,
		expectedOrigin,
		expectedRPID,
	})

	const {verified, registrationInfo} = verification

	if (!verified) {
		throw 'User verification failed.'
	}

	const {credentialPublicKey, credentialID, counter} = registrationInfo
	const base64PublicKey = base64url.encode(credentialPublicKey)
	const base64CredentialID = base64url.encode(credentialID)

	const user = db.get('users')
		.find({username})
		.value()

	const existingCred = user.credentials.find(cred => cred.credID === base64CredentialID)

	if (!existingCred) {
		/**
		 * Add the returned device to the user's list of devices
		 */
		user.credentials.push({
			publicKey: base64PublicKey,
			credId: base64CredentialID,
		})
	}

	console.log('assign user', user)

	db.get('users')
		.find({username})
		.assign(user)
		.write()

	return user
}

export async function loginRequest(username, userVerification = 'required') {
	let rpID = process.env.HOSTNAME
	
	const user = db
		.get('users')
		.find({username})
		.value()

	// Send empty response if user is not registered yet.
	if (!user) throw 'User not found.'

	const allowCredentials = user.credentials.map(getAllowedCredential)

	const options = fido2.generateAuthenticationOptions({
		timeout: TIMEOUT,
		rpID,
		allowCredentials,
		// This optional value controls whether or not the authenticator needs be able to uniquely
		// identify the user interacting with it (via built-in PIN pad, fingerprint scanner, etc...)
		userVerification,
	})

	return options
}

const getAllowedCredential = cred => ({
	id: base64url.toBuffer(cred.credId),
	type: 'public-key',
	transports: ['internal'],
})

export async function loginResponse(expectedChallenge, username, body) {
	const expectedOrigin = process.env.ORIGIN
	const expectedRPID = process.env.HOSTNAME

	// Query the user
	const user = db
		.get('users')
		.find({username})
		.value()

	let credential = user.credentials.find(cred => cred.credId === body.id)

	if (!credential) throw 'Authenticating credential not found.'

	const verification = fido2.verifyAuthenticationResponse({
		credential: body,
		expectedChallenge,
		expectedOrigin,
		expectedRPID,
		authenticator: {
			...credential,
			credentialPublicKey: base64url.toBuffer(credential.publicKey),
			credentialID: base64url.toBuffer(credential.credId),
			prevCounter: 0,
			counter: 0,
		},
	})

	const {verified, authenticationInfo} = verification
	console.log('~ verified', verified)
	console.log('~ authenticationInfo', authenticationInfo)

	if (!verified) throw 'User verification failed.'

	console.log('assign user', user)

	db.get('users')
		.find({username})
		.assign(user)
		.write()

	return user
}