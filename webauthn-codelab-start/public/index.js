import {postJson} from '/client.js'


const form = document.querySelector('#form')
form.addEventListener('submit', e => {
	e.preventDefault()
	const form = new FormData(e.target)
	const cred = {}
	form.forEach((v, k) => (cred[k] = v))
	postJson(e.target.action, cred)
		.then(user => location.href = '/reauth')
		.catch(alert)
})
