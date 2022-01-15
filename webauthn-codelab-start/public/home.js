import {html, render} from 'https://unpkg.com/lit-html@1.0.0/lit-html.js?module'
import {postJson, registerCredential, unregisterCredential} from '/client.js'
import {checkBiometrics} from '/util.js'

const register = document.querySelector('#register')


async function main() {
	const hasBiometrics = await checkBiometrics()
	console.log('~ hasBiometrics', hasBiometrics)

	if (!hasBiometrics) {
		alert(`doesn't support biometrics`)
	}
}

async function getCredentials() {
	console.log('getCredentials()')
	const res = await postJson('/auth/get-keys')
	console.log('~ res', res)
	const list = document.querySelector('#list')
	console.log('~ list', list)
	const creds = html`${res.credentials.length > 0
		? res.credentials.map(
				cred => html` <div class="mdc-card credential">
					<span class="mdc-typography mdc-typography--body2"
						>${cred.credId}</span
					>
					<pre class="public-key">${cred.publicKey}</pre>
					<div class="mdc-card__actions">
						<mwc-button
							id="${cred.credId}"
							@click="${removeCredential}"
							raised
							>Remove</mwc-button
						>
					</div>
				</div>`
		  )
		: html` <p>No credentials found.</p> `}`
	render(creds, list)
}

async function removeCredential() {
	try {
		await unregisterCredential(e.target.id)
		getCredentials()
	} catch (e) {
		alert(e)
	}
}

register.addEventListener('click', e => {
	registerCredential().then(getCredentials).catch(alert)
})

main()
