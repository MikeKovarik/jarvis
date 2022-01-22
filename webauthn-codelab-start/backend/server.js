import express from 'express'
import session from 'express-session'
import auth from './auth.js'
const app = express()
import {port, secret} from './config.js'


app.use(express.json())
app.use(express.static('frontend'))

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
