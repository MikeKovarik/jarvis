import fetch from 'node-fetch'
import config from './config.js'
import {entities} from './shared/entities.js'
import {scenes2} from './shared/scenes2.js'
import {sanitizePrefix} from './util/hass-util.js'
import {topics} from './shared/mqtt.js'


export function callService(service, body) {
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

    console.log('callService')
    console.log('url', url)
    console.log('options', options)

	return fetch(url, options).then(res => res.json())
}

export function callScene(entityId) {
	entityId = sanitizePrefix('scene.', entityId)
	//const entity = entities.get(entityId)
	//console.log('entity', entity)
	//const sceneId = entity.id
	return callService('scene.turn_on', {'entity_id': entityId})
}

/*
setTimeout(() => {
	//callScene('scene.bedroom_cosy').then(console.log)
	callScene('scene.bedroom_on').then(console.log)
}, 3000)

setTimeout(() => {
	callScene('scene.bedroom_off').then(console.log)
}, 5000)
*/
