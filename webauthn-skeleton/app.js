const Koa = require('koa')
const serve = require('koa-static')
const bodyParser = require('koa-bodyparser')
const session = require('koa-session')

const path = require('path')
const crypto = require('crypto')

const config = require('./config')

const defaultroutes = require('./routes/default')
const webuathnroutes = require('./routes/webauthn.js')

const app = new Koa()

// Static files (./static)
app.use(serve(path.join(__dirname, './static')))

// Session
app.keys = [crypto.randomBytes(32).toString('hex')]
app.use(session({key: 'session'}, app))

// Middleware
app.use(bodyParser())

//Routes
app.use(defaultroutes.routes())
app.use(defaultroutes.allowedMethods())

app.use(webuathnroutes.routes())
app.use(webuathnroutes.allowedMethods())

// Local development
if (config.mode === 'development') {
	const https = require('https')
	const fs = require('fs')
	https.createServer({
		//key: fs.readFileSync('./keys/key.pem'),
		//cert: fs.readFileSync('./keys/cert.pem')
		key: fs.readFileSync('./keys/anchora.192.168.1.171.key'),
		cert: fs.readFileSync('./keys/anchora.192.168.1.171.crt')
	}, app.callback()).listen(config.port)  

// 'Production' HTTP - (for use behind https proxy)
} else {
	app.listen(config.port)

}

console.log(`Started app on port ${config.port}`)