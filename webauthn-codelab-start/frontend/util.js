export async function checkBiometrics() {
	return await window
		.PublicKeyCredential
		?.isUserVerifyingPlatformAuthenticatorAvailable()
	?? false
}

export const goTo = route => location.href = '#' + route