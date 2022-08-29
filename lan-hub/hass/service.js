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

    console.log('calling service', service, options.body)
    console.log(url)
	try {
		return await fetch(url, options).then(res => res.json())
	} catch (err) {
		console.error(err)
	}
    console.log('called service', service)
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
