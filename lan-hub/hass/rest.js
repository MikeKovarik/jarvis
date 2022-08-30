import fetch from 'node-fetch'
import config from '../config.js'


export function callService(domain, service, body) {
	const url = `${process.env.HASS_URL}/api/services/${domain}/${service}`
	
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

	return fetch(url, options).then(res => res.json())
}
