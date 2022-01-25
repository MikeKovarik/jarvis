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

app.use((req, res, next) => {
	console.log(req.method, req.url)
	next()
})

app.get('/hello', (req, res) => {
	console.log('handling /hello')
	res.json({hello: 'world'})
})

app.listen(config.appPort, () => {
	console.log('Your app is listening on port ' + config.appPort)
	config.tunnelEncryption.key = undefined
	config.tunnelEncryption.iv  = undefined
	exposeThroughProxy({
		log: DEBUG,
		...config
	})
})
