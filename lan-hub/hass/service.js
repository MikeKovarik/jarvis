import fetch from 'node-fetch'
import config from '../config.js'


export async function callService(service, body) {
	const url = `${process.env.HASS_API_URL}/services/${service.replace(/\./g, '/')}`
	
	const options = {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${config.hassToken}`
		}
	}

	if (body) {
		options.headers['content-type'] = 'application/json'
		options.body = JSON.stringify(body)
	}

	const id = Math.round(Math.random() * 1000).toString()
    console.log(`callService: ${id}`, service, options.body)
    console.log(url)
	console.time(`callService: ${id}`)
	let result
	try {
		result = await fetch(url, options).then(res => res.json())
	} catch (err) {
		console.error(err)
	}
	console.timeEnd(`callService: ${id}`)
	return result
}

/*
setTimeout(() => {
	//setScene('scene.bedroom_cosy').then(console.log)
	setScene('scene.bedroom_on').then(console.log)
}, 3000)

setTimeout(() => {
	setScene('scene.bedroom_off').then(console.log)
}, 5000)
*/
