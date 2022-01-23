import renderHome from './home.js'
import renderLogin from './login.js'
import auth from './auth.js'


let routes = {
	'/login': renderLogin,
	'/home':  renderHome,
}

function handleRoute() {
	let route = location.hash.slice(1)
	if (!routes[route]) {
		let url = window.location.pathname + window.location.search
		history.replaceState('', document.title, url)
	}
	let render = routes[route] || renderLogin
	render()
}

async function main() {
	await auth.ready
	await handleRoute()
}

main()

window.addEventListener('hashchange', handleRoute, false)