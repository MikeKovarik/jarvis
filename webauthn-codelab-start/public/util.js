export const bufferToBase64 = buffer => btoa(String.fromCharCode(...new Uint8Array(buffer)))
export const base64ToBuffer = base64 => Uint8Array.from(atob(base64), c => c.charCodeAt(0))

export async function checkBiometrics() {
	return await window
		.PublicKeyCredential
		?.isUserVerifyingPlatformAuthenticatorAvailable()
	?? false
}