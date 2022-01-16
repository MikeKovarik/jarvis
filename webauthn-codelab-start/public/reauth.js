import {html, render} from 'https://unpkg.com/lit-html@1.0.0/lit-html.js?module'
import auth from '/auth.js'


let username = auth.username
let password

render(html`
	credId: ${auth.credId}
	<br>
	<input type="text" placeholder="Username" @change=${e => username = e.target.value} .value=${username ?? ''} />
	<input type="password" placeholder="Password" @change=${e => password = e.target.value} />
	<button @click=${onSubmitPassword}>Log in with password</button>
	<button @click=${onSubmitBiometrics} ?disabled=${!auth.credId}>Log in with biometrics</button>
`, document.body)

const redirect = where => location.href = where

async function onSubmitPassword() {
	let loggedIn = await auth.loginWithPassword(password, username)
	if (loggedIn) redirect('/home')
}

async function onSubmitBiometrics() {
    console.log('~ onSubmitBiometrics')
	let loggedIn = await auth.loginWithBiometrics()
    console.log('~ loggedIn', loggedIn)
	if (loggedIn) redirect('/home')
}