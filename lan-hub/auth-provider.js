import util from 'util'
import {app} from './server.js'
import config from './config.js'


const HTTP_STATUS_OK = 200
const tokenExpiration = 86400 // 60 * 60 * 24

app.get('/login', (req, res) => {
	console.gray('--- AUTH', '-'.repeat(100))
	console.magenta('GET /login')
	console.magenta('req.query.response_url', req.query.response_url)
	res.send(`
		<html>
		<head>
			<title>Jarvis</title>
			<meta charset="utf-8" />
			<meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no"/>
			<style>
			body {
				padding: 0;
				margin: 0;
				height: 100%;
				display: flex;
				align-items: center;
				justify-content: center;
			}
			button {
				font-size: 24px;
			}
			</style>
		</head>
		<body>
			<form action="/login" method="post">
				<input type="hidden" name="response_url" value="${req.query.response_url}" />
				<button type="submit">Link this service to Google</button>
			</form>
		</body>
		</html>
	`)
})

app.post('/login', async (req, res) => {
	console.gray('--- AUTH', '-'.repeat(100))
	console.magenta('POST /login')
	console.magenta(req.body)
	const responseUrl = decodeURIComponent(req.body.response_url)
	console.gray('responseUrl', responseUrl)
	return res.redirect(responseUrl)
})

app.get('/auth', async (req, res) => {
	console.gray('--- AUTH', '-'.repeat(100))
	console.magenta('GET /auth')
	console.magenta(req.body)
	const responseUrl = util.format(
		'%s?code=%s&state=%s',
		decodeURIComponent(req.query.redirect_uri),
		'xxxxxx',
		req.query.state
	)
	const redirectUrl = `/login?response_url=${encodeURIComponent(responseUrl)}`
	console.gray('responseUrl', responseUrl)
	console.gray('redirectUrl', redirectUrl)
	return res.redirect(redirectUrl)
})

app.post('/token', async (req, res) => {
	console.magenta('--- AUTH', '-'.repeat(100))
	const {body, query} = req
	console.magenta(req.method, '/token')
	console.magenta('query', req.query)
	console.magenta('body ', body)
	if (body.client_secret !== config.secret || body.client_id !== config.client_id) {
		throw `Incorrect Google app`
	}
	let token
	const grantType = query.grant_type || body.grant_type
	if (grantType === 'authorization_code') {
		token = {
			token_type: 'bearer',
			access_token: '123access',
			refresh_token: '123refresh',
			expires_in: tokenExpiration,
		}
	} else if (grantType === 'refresh_token') {
		token = {
			token_type: 'bearer',
			access_token: '123access',
			expires_in: tokenExpiration,
		}
	}
	console.gray('token', token)
	res.status(HTTP_STATUS_OK).json(token)
})
