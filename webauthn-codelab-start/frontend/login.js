import {html, render} from 'https://unpkg.com/lit-html@1.0.0/lit-html.js?module'
import auth from '/auth.js'
import {goTo} from './util.js'


let password
let $status

export default () => {
	render(html`
		<input type="password" placeholder="Password" @change=${e => password = e.target.value} />
		<button @click=${onSubmitPassword}>Log in with password</button>
		<br>or<br>
		<button @click=${onSubmitBiometrics}>Log in with biometrics</button>
		<br>
		<div id="status"></div>
	`, document.body)

	$status = document.querySelector('#status')
}

const renderStatus = (status = '') => render(status, $status)

async function onSubmitPassword() {
	renderStatus('logging in')
	let loggedIn = await auth.loginWithPassword(password)
	renderStatus('')
	if (loggedIn) goTo('/home')
}

async function onSubmitBiometrics() {
	renderStatus('logging in')
	let loggedIn = await auth.loginWithBiometrics()
	renderStatus('')
	if (loggedIn) goTo('/home')
}