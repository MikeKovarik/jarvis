import fido2 from '@simplewebauthn/server'
import base64url from 'base64url'


// const regParams = [-7, -35, -36, -257, -258, -259, -37, -38, -39, -8];
const regParams = [-7, -257]

export default class WebAuthn {

	constructor(arg) {
		this.loadUser   = arg.loadUser
		this.updateUser = arg.updateUser
		this.origin     = arg.origin
		this.rpID       = arg.rpID
		this.rpName     = arg.rpName
		this.timeout    = arg.timeout ?? 30 * 1000 * 60
	}

	async registerRequest(username, body) {
		const user = await this.loadUser(username)

		const excludeCredentials = user.credentials.map(this.credToPublicKeyDescriptor)

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
			rpName: this.rpName,
			rpID: this.rpID,
			userID: user.id,
			userName: user.username,
			timeout: this.timeout,
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

	async registerResponse(expectedChallenge, username, credential) {
		const verification = await fido2.verifyRegistrationResponse({
			credential,
			expectedChallenge,
			expectedOrigin: this.origin,
			expectedRPID: this.rpID,
		})

		if (!verification.verified) throw 'User verification failed.'

		const user = await this.loadUser(username)

		const existingCred = user.credentials.find(cred => cred.credID === credId)

		if (!existingCred) {
			// convert buffer data to http & db friendly base64 string
			let newCred = this.packCredential(verification.registrationInfo)
			user.credentials.push(newCred)
		}

		await this.updateUser(username, user)

		return user
	}

	async loginRequest(username, userVerification = 'required') {
		const user = await this.loadUser(username)
		if (!user) throw 'User not found.'

		const allowCredentials = user.credentials.map(this.credToPublicKeyDescriptor)

		return fido2.generateAuthenticationOptions({
			timeout: this.timeout,
			rpID: this.rpID,
			allowCredentials,
			// This optional value controls whether or not the authenticator needs be able to uniquely
			// identify the user interacting with it (via built-in PIN pad, fingerprint scanner, etc...)
			userVerification,
		})
	}

	async loginResponse(expectedChallenge, username, body) {
		const user = await this.loadUser(username)

		let credential = user.credentials.find(cred => cred.credId === body.id)
		if (!credential) throw 'Authenticating credential not found.'

		// convert from http & db friendly base64 string to FIDO friendtly buffer data
		const authenticator = this.reviveCredential(credential)

		const verification = fido2.verifyAuthenticationResponse({
			credential: body,
			expectedChallenge,
			expectedOrigin: this.origin,
			expectedRPID: this.rpID,
			authenticator,
		})

		if (!verification.verified) throw 'User verification failed.'

		await this.updateUser(username, user)

		return user
	}

	packCredential({credentialID, credentialPublicKey, counter}) {
		return {
			credId:    base64url.encode(credentialID),
			publicKey: base64url.encode(credentialPublicKey),
		}
	}

	reviveCredential({credId, publicKey}) {
		return {
			credentialID:        base64url.toBuffer(credId),
			credentialPublicKey: base64url.toBuffer(publicKey),
			counter: 0,
		}
	}

	credToPublicKeyDescriptor = ({credId}) => {
		return {
			id: base64url.toBuffer(credId),
			type: 'public-key',
			transports: ['internal'],
		}
	}

}