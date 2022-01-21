import {html, render} from 'https://unpkg.com/lit-html@1.0.0/lit-html.js?module'
import {postJson, registerCredential, unregisterCredential} from './client.js'
import auth from './auth.js'


render(html`
	<h2>Welcome, ${auth.username}!</h2>
	<h3>Your registered credentials:</h3>
	<div id="list"></div>
	<button @click=${addCredential}>Add credential</button>
	<button @click=${() => redirect('/reauth')}>Try reauth</button>
	<button @click=${() => redirect('/auth/signout')}>Sign out</button>
`, document.body)

const $list = document.querySelector('#list')
getCredentials()

const redirect = where => location.href = where

async function removeCredential(credId) {
	console.log('removeCredential()', credId)
	await unregisterCredential(credId)
	await getCredentials()
}

async function addCredential() {
	console.log('addCredential()')
	await registerCredential()
	await getCredentials()
}

async function getCredentials() {
	console.log('getCredentials()')
	const {credentials} = await postJson('/auth/get-keys')
	renderCredentials(credentials)
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