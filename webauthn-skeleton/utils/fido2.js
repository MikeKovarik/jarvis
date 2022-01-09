import base64url from '@hexagon/base64-arraybuffer'
import fido2lib from 'fido2-lib'
const { Fido2Lib } = fido2lib

export default class Fido2 {

	constructor(rpId, rpName, timeout) {
		this.f2l = new Fido2Lib({
			timeout,
			rpId,
			rpName,
			challengeSize: 128,
			attestation: 'none',
			cryptoParams: [-7, -257],
			authenticatorAttachment: undefined, // ['platform', 'cross-platform']
			authenticatorRequireResidentKey: false,
			authenticatorUserVerification: 'preferred'
		})
	}

	async registration(displayName) {
		let registrationOptions = await this.f2l.attestationOptions()
		const id = 'default'
		const name = 'default'
		registrationOptions.user = {id, name, displayName}
		registrationOptions.status = 'ok'
		registrationOptions.challenge = base64url.encode(registrationOptions.challenge, true)
		return registrationOptions
	}

	async attestation(clientAttestationResponse, origin, challenge) {
		let attestationExpectations = {
			challenge,
			origin,
			factor: 'either'
		}
		return this.f2l.attestationResult(clientAttestationResponse, attestationExpectations) // will throw on error
	}

	async login() {
		let assertionOptions = await this.f2l.assertionOptions()
		assertionOptions.challenge = base64url.encode(assertionOptions.challenge, true)
		assertionOptions.status = 'ok'
		return assertionOptions
	}

	async assertion(assertionResult, expectedAssertionResult) {
		return this.f2l.assertionResult(assertionResult, expectedAssertionResult) // will throw on error
	}

}
