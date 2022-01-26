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
		this.multipleCredentialsPerDevice = true
	}

	async registerRequest({username, rpID, credential}) {
		const user = await this.loadUser(username)

		const excludeCredentials = this.multipleCredentialsPerDevice
			? []
			: user.credentials.map(this.credToPublicKeyDescriptor)

		const as = {} // authenticatorSelection
		const aa = credential.authenticatorSelection.authenticatorAttachment
		const rr = credential.authenticatorSelection.requireResidentKey
		const uv = credential.authenticatorSelection.userVerification
		const cp = credential.attestation // attestationConveyancePreference
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
			rpID,
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

	async registerResponse({username, rpID, origin, expectedChallenge, credential}) {
		const verification = await fido2.verifyRegistrationResponse({
			credential,
			expectedChallenge,
			expectedOrigin: origin,
			expectedRPID: rpID,
		})

		if (!verification.verified) throw 'User verification failed.'

		const user = await this.loadUser(username)
		// convert buffer data to http & db friendly base64 string
		let newCred = this.packCredential(verification.registrationInfo, credential)
		user.credentials.push(newCred)

		await this.updateUser(username, user)

		return user
	}

	async loginRequest({username, rpID, userVerification = 'required'} = {}) {
		const user = await this.loadUser(username)
		if (!user) throw 'User not found.'

		const allowCredentials = user.credentials.map(this.credToPublicKeyDescriptor)

		return fido2.generateAuthenticationOptions({
			timeout: this.timeout,
			rpID,
			allowCredentials,
			// This optional value controls whether or not the authenticator needs be able to uniquely
			// identify the user interacting with it (via built-in PIN pad, fingerprint scanner, etc...)
			userVerification,
		})
	}

	async loginResponse({username, rpID, origin, expectedChallenge, credential}) {
		const user = await this.loadUser(username)

		let publicKey = user.credentials.find(cred => cred.credId === credential.id)
		if (!publicKey) throw 'Authenticating publicKey not found.'
		publicKey = this.reviveCredential(publicKey)

		const verification = fido2.verifyAuthenticationResponse({
			credential,
			expectedChallenge,
			expectedOrigin: origin,
			expectedRPID: rpID,
			authenticator: publicKey,
		})

		if (!verification.verified) throw 'User verification failed.'

		await this.updateUser(username, user)

		return user
	}

	getRpFromHeaders(headers) {
		return {
			rpID:   this.rpID   ?? headers.host.split(':')[0], // remove port
			origin: this.origin ?? headers.origin, // full url with protocol and port
		}
	}

	packCredential({credentialID, credentialPublicKey, counter}, {name}) {
		return {
			name,
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