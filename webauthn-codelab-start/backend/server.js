import express from 'express'
import session from 'express-session'
import auth from './auth.js'
const app = express()
import config from './config.js'
import {exposeThroughProxy, DEBUG} from 'lan-tunnel'


app.use(express.json())
app.use(express.static('frontend'))

app.use(session({
    secret: config.secret,
	resave: true,
	saveUninitialized: false,
    cookie: {
		secure: false,
	}
}))

app.use('/auth', auth)

app.listen(config.appPort, () => {
	console.log('Your app is listening on port ' + config.appPort)
	exposeThroughProxy({
		log: DEBUG,
		...config
	})
})
