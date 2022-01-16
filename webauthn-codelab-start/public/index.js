import {html, render} from 'https://unpkg.com/lit-html@1.0.0/lit-html.js?module'
import auth from '/auth.js'


let username

render(html`
	<input type="text" placeholder="Username" @change=${e => username = e.target.value} />
	<button @click=${onSubmit}>Next</button>
`, document.body)

const redirect = where => location.href = where

async function onSubmit() {
    console.log('~ username', username)
	await auth.addUsername(username)
	redirect('/reauth')
}