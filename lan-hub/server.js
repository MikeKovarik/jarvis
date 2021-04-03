import path from 'path'
import {fileURLToPath} from 'url'
import express from 'express'
import {exposeThroughProxy} from 'lan-tunnel'
import bodyParser from 'body-parser'
import config from './config.js'


const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const app = express()

app.use(bodyParser.json({limit: '100mb'}))
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}))
app.set('json spaces', 2)
app.use(express.static(path.join(__dirname, '../static')))

app.listen(config.appPort, () => {
	console.log(`Listening on port ${config.appPort}`)
	// wait for the http server to start
	exposeThroughProxy({
		log: true,
		...config
	})
})