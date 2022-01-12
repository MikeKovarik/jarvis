import {register, login} from './webauthn.auth.js'
import {getJson} from './utils.js'


const $ = document.querySelector.bind(document)

const renderMainContainer = (response) => {
	let table = $('table')
	table.innerHTML = response.authenticators.map(auth => `
		<tr>
			<td>${auth.name}</td>
			<td><pre>${auth.publicKey}</pre></td>
		</tr>
	`).join('')
}

export const loadMainContainer = async () => {
	let data = await getJson('/personalInfo')
	renderMainContainer(data)
}

export const checkIfLoggedIn = async () => {
	try {
		await getJson('/isLoggedIn')
		return true
	} catch {
		return false
	}
}

$('#login').addEventListener('click', login)

$('#logout').addEventListener('click', async () => {
	await fetch('/logout', {credentials: 'include'})
	console.log('logged out?')
})

$('#register').addEventListener('click', () => {
	const name = $('#name').value
	if (name)
		register(name)
	else
		alert('Username is missing!')
})
