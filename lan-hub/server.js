import express from 'express'
import {exposeThroughProxy} from 'lan-tunnel'
import bodyParser from 'body-parser'
import {tunnelConfig} from '../shared/config.js'


export const app = express()

app.use(bodyParser.json({limit: '100mb'}));
app.use(bodyParser.urlencoded({limit: '100mb', extended: true}));
app.set('json spaces', 2)
app.use(express.static('static'))

app.listen(tunnelConfig.appPort, () => {
	console.log(`Listening on port ${tunnelConfig.appPort}`)
	// wait for the http server to start
	exposeThroughProxy({
		log: true,
		...tunnelConfig
	})
})