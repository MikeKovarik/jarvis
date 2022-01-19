export async function checkBiometrics() {
	return await window
		.PublicKeyCredential
		?.isUserVerifyingPlatformAuthenticatorAvailable()
	?? false
}