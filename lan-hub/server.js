import express from 'express'
import {exposeThroughProxy} from 'lan-tunnel'
import bodyParser from 'body-parser'
import {tunnelConfig} from '../../shared/config.js'


export const app = express()

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })) 
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