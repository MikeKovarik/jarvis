import {html, render} from 'https://unpkg.com/lit-html@1.0.0/lit-html.js?module'
import auth from './auth.js'
import {goTo} from './util.js'


let $list
let $status
let credentialName

export default () => {
	if (!auth.loggedIn) goTo('/')

	render(html`
		<h3>Credentials</h3>
		<div id="list"></div>
		<input placeholder="Credential name" @change=${e => credentialName = e.target.value} />
		<button @click=${addCredential}>Add credential</button>
		<br>
		<button @click=${() => goTo('/login')}>Try reauth</button>
		<button @click=${() => logout()}>Sign out</button>
		<br>
		<div id="status"></div>
	`, document.body)

	$list = document.querySelector('#list')
	$status = document.querySelector('#status')
	loadCredentials()
}

const renderStatus = (status = '') => render(status, $status)

async function removeCredential(credId) {
	renderStatus('deleting')
	await auth.unregisterCredential(credId)
	await loadCredentials()
}

async function addCredential() {
	renderStatus('adding')
	await auth.registerCredential(credentialName)
	credentialName = undefined
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
				<span class="credential-name">${cred.name}</span>
				<span class="credential-rpid">${cred.rpID}</span>
				<span class="credential-id">${cred.credId}</span>
				<button id="${cred.credId}" @click="${() => removeCredential(cred.credId)}">X</button>
			</div>
		`)
		: html` <p>No credentials found.</p> `}`
	render(creds, $list)
				//<pre class="credential-key">${cred.publicKey}</pre>
}