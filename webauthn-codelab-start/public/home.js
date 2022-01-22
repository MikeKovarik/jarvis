import {html, render} from 'https://unpkg.com/lit-html@1.0.0/lit-html.js?module'
import auth from './auth.js'
import {goTo} from './util.js'


let $list

export default () => {
	if (!auth.loggedIn) goTo('/')

	render(html`
		<h2>Welcome, ${auth.username}!</h2>
		<h3>Your registered credentials:</h3>
		<div id="list"></div>
		<button @click=${addCredential}>Add credential</button>
		<button @click=${() => goTo('/login')}>Try reauth</button>
		<button @click=${() => logout()}>Sign out</button>
	`, document.body)

	$list = document.querySelector('#list')
	loadCredentials()
}

async function removeCredential(credId) {
	console.log('removeCredential()', credId)
	await auth.unregisterCredential(credId)
	await loadCredentials()
}

async function addCredential() {
	console.log('addCredential()')
	await auth.registerCredential()
	await loadCredentials()
}

async function loadCredentials() {
	console.log('loadCredentials()')
	const credentials = await auth.getCredentials()
	renderCredentials(credentials)
}

async function logout() {
	console.log('logout()')
	await auth.logout()
	goTo('/')
}

function renderCredentials(credentials) {
	console.log('renderCredentials()', credentials)
	const creds = html`${credentials.length > 0
		? credentials.map(cred => html`
			<div class="credential">
				<span class="credential-id">${cred.credId}</span>
				<pre class="credential-key">${cred.publicKey}</pre>
				<button id="${cred.credId}" @click="${() => removeCredential(cred.credId)}">Remove</button>
			</div>
		`)
		: html` <p>No credentials found.</p> `}`
	render(creds, $list)
}