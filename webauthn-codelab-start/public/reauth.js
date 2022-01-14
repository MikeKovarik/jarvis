import { _fetch, authenticate } from '/client.js'

new mdc.textField.MDCTextField(document.querySelector('.mdc-text-field'))

const form = document.querySelector('#form')
form.addEventListener('submit', e => {
	e.preventDefault()
	const form = new FormData(e.target)
	const cred = {}
	form.forEach((v, k) => (cred[k] = v))
	_fetch(e.target.action, cred)
		.then(user => {
			location.href = '/home'
		})
		.catch(e => alert(e))
})

if (window.PublicKeyCredential) {
	PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(
		uvpaa => {
			if (uvpaa && localStorage.getItem(`credId`)) {
				document
					.querySelector('#uvpa_available')
					.classList.remove('hidden')
			} else {
				form.classList.remove('hidden')
			}
		}
	)
} else {
	form.classList.remove('hidden')
}

const cancel = document.querySelector('#cancel')
cancel.addEventListener('click', e => {
	form.classList.remove('hidden')
	document.querySelector('#uvpa_available').classList.add('hidden')
})

const button = document.querySelector('#reauth')
button.addEventListener('click', e => {
	authenticate()
		.then(user => {
			if (user) {
				location.href = '/home'
			} else {
				throw 'User not found.'
			}
		})
		.catch(e => {
			console.error(e.message || e)
			alert('Authentication failed. Use password to sign-in.')
			form.classList.remove('hidden')
			document.querySelector('#uvpa_available').classList.add('hidden')
		})
})
