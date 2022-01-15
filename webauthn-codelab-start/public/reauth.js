import {postJson, authenticate} from '/client.js'


const form = document.querySelector('#form')
const button = document.querySelector('#reauth')


const redirect = where => location.href = where

form.addEventListener('submit', e => {
	e.preventDefault()
	const form = new FormData(e.target)
	const cred = {}
	form.forEach((v, k) => (cred[k] = v))
	postJson('/auth/password', cred)
		.then(user => redirect('/home'))
		.catch(e => alert(e))
})

button.addEventListener('click', async e => {
	try {
		let user = await authenticate()
		if (user)
			redirect('/home')
		else
			throw 'User not found.'
	} catch(e) {
		console.error(e.message || e)
		alert('Authentication failed. Use password to sign-in.')
	}
})