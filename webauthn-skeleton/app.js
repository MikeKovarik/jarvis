import Koa from 'koa'
import serve from 'koa-static'
import bodyParser from 'koa-bodyparser'
import session from 'koa-session'
import {fileURLToPath} from 'url'
import path from 'path'
import crypto from 'crypto'
import https from 'https'
import fs from 'fs'
import config from './config.js'
import defaultroutes from './routes/default.js'
import webuathnroutes from './routes/webauthn.js'

const app = new Koa()

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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