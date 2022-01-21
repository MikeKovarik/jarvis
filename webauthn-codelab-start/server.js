import express from 'express'
import session from 'express-session'
import hbs from 'hbs'
import auth from './routes/auth.js'
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

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', (req, res) => {
	console.log('GET /')
	// Check session
	if (req.session.username) {
		// If user is logged in, redirect to `/reauth`.
		res.redirect(307, '/reauth')
		return
	}
	// If user is not logged in, show `index.html` with id/password form.
	res.render('index.html')
})

app.get('/home', (req, res) => {
	console.log('GET /home')
	console.log('~ req.session.username', req.session.username)
    console.log('~ req.session.loggedIn', req.session.loggedIn)
	if (!req.session.username || !req.session.loggedIn) {
		console.log('not logged in')
		// If user is not logged in, redirect to `/`.
		res.redirect(307, '/')
		return
	}
	// `home.html` shows sign-out link
	res.render('home.html', {username: req.session.username})
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
	res.render('reauth.html', {username: username})
})

app.use('/auth', auth)

// listen for req :)
const port = process.env.GLITCH_DEBUGGER ? null : 8080
const listener = app.listen(port || process.env.PORT, () => {
	console.log('Your app is listening on port ' + listener.address().port)
})
