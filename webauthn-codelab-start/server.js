/*
 * @license
 * Copyright 2019 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License
 */

// init project
const express = require('express')
const session = require('express-session')
const hbs = require('hbs')
const auth = require('./routes/auth')
const app = express()

app.set('view engine', 'html')
app.engine('html', hbs.__express)
app.set('views', './views')
app.use(express.json())
app.use(express.static('public'))

app.use(session({
    secret: 'TODO', // TODO
	resave: true,
	saveUninitialized: false,
    cookie: {
		secure: false,
	}
}))


app.use((req, res, next) => {
	//req.session.username = 'mike'
	//req.session['signed-in'] = 'yes'

	//process.env.HOSTNAME = req.headers.host

	//process.env.HOSTNAME = req.headers.host.split(':')[0]
    //console.log('~ process.env.HOSTNAME', process.env.HOSTNAME)
	//const protocol = /^localhost/.test(process.env.HOSTNAME) ? 'http' : 'https'
	//process.env.ORIGIN = `${protocol}://${process.env.HOSTNAME}`
    //console.log('~ process.env.ORIGIN', process.env.ORIGIN)

	let protocol = /^localhost/.test(process.env.HOSTNAME) ? 'http' : 'https'
	process.env.HOSTNAME = req.headers.host.split(':')[0]
	process.env.ORIGIN = `${protocol}://${req.headers.host}`


	/*
	if (
		req.get('x-forwarded-proto') &&
		req.get('x-forwarded-proto').split(',')[0] !== 'https'
	) {
		return res.redirect(301, process.env.ORIGIN)
	}
	req.schema = 'https'
	*/
	next()
})

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', (req, res) => {
	console.log('GET /')
	// Check session
	if (req.session.username) {
		// If user is signed in, redirect to `/reauth`.
		res.redirect(307, '/reauth')
		return
	}
	// If user is not signed in, show `index.html` with id/password form.
	res.render('index.html')
})

app.get('/home', (req, res) => {
	console.log('GET /home')
	console.log('~ req.session.username', req.session.username)
	if (!req.session.username || req.session['signed-in'] !== 'yes') {
		console.log('not signed in')
		// If user is not signed in, redirect to `/`.
		res.redirect(307, '/')
		return
	}
	// `home.html` shows sign-out link
	res.render('home.html', { username: req.session.username })
})

app.get('/reauth', (req, res) => {
	console.log('GET /reauth')
	const username = req.session.username
    console.log('~ req.session.username', req.session.username)
	if (!username) {
		res.redirect(302, '/')
		return
	}
	// Show `reauth.html`.
	// User is supposed to enter a password (which will be ignored)
	// Make XHR POST to `/signin`
	res.render('reauth.html', { username: username })
})

app.use('/auth', auth)

// listen for req :)
const port = process.env.GLITCH_DEBUGGER ? null : 8080
const listener = app.listen(port || process.env.PORT, () => {
	console.log('Your app is listening on port ' + listener.address().port)
})
