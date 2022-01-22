import {html, render} from 'https://unpkg.com/lit-html@1.0.0/lit-html.js?module'
import auth from './auth.js'
import {goTo} from './util.js'


let $list
let $status

export default () => {
	if (!auth.loggedIn) goTo('/')

	render(html`
		<h2>Welcome, ${auth.username}!</h2>
		<h3>Your registered credentials:</h3>
		<div id="list"></div>
		<button @click=${addCredential}>Add credential</button>
		<button @click=${() => goTo('/login')}>Try reauth</button>
		<button @click=${() => logout()}>Sign out</button>
		<br>
		<div id="status"></div>
	`, document.body)

	$list = document.querySelector('#list')
	$status = document.querySelector('#status')
	loadCredentials()
}

async function renderStatus(status = '') {
	$status.innerHTML = status
}

async function removeCredential(credId) {
	renderStatus('deleting')
	await auth.unregisterCredential(credId)
	await loadCredentials()
}

async function addCredential() {
	renderStatus('adding')
	await auth.registerCredential()
	await loadCredentials()
}

async function loadCredentials() {
	renderStatus('loading')
	const credentials = await auth.getCredentials()
	renderCredentials(credentials)
	renderStatus()
}

async function logout() {
	renderStatus('logging out')
	await auth.logout()
	renderStatus()
	goTo('/')
}

function renderCredentials(credentials) {
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