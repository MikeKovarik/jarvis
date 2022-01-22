import express from 'express'
import session from 'express-session'
import auth from './routes/auth.js'
const app = express()


const port = 8080
const secret = 'TODO'

app.use(express.json())
app.use(express.static('public'))

app.use(session({
    secret,
	resave: true,
	saveUninitialized: false,
    cookie: {
		secure: false,
	}
}))

app.use('/auth', auth)

const listener = app.listen(port, () => {
	console.log('Your app is listening on port ' + listener.address().port)
})
