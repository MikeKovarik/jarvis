import {html, render} from 'https://unpkg.com/lit-html@1.0.0/lit-html.js?module'
import auth from '/auth.js'
import {goTo} from './util.js'


let username

export default () => {
	if (auth.username) goTo('/login')

	render(html`
		<input type="text" placeholder="Username" @change=${e => username = e.target.value} />
		<button @click=${onSubmit}>Next</button>
	`, document.body)
}

async function onSubmit() {
	await auth.addUsername(username)
	goTo('/login')
}