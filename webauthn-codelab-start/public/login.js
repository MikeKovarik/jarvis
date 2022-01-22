import {html, render} from 'https://unpkg.com/lit-html@1.0.0/lit-html.js?module'
import auth from '/auth.js'
import {goTo} from './util.js'


let password

export default () => {
	//if (auth.loggedIn) goTo('/home') // disabled due to "try reauth" button
	if (!auth.username) goTo('/')

	render(html`
		<input type="password" placeholder="Password" @change=${e => password = e.target.value} />
		<button @click=${onSubmitPassword}>Log in with password</button>
		<br>or<br>
		<button @click=${onSubmitBiometrics}>Log in with biometrics</button>
	`, document.body)
}

async function onSubmitPassword() {
	let loggedIn = await auth.loginWithPassword(password)
	if (loggedIn) goTo('/home')
}

async function onSubmitBiometrics() {
    console.log('~ onSubmitBiometrics')
	let loggedIn = await auth.loginWithBiometrics()
    console.log('~ loggedIn', loggedIn)
	if (loggedIn) goTo('/home')
}