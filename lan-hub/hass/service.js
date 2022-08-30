import * as ws from './ws.js'
import * as rest from './rest.js'


export async function callService(fullServiceName, data) {
	const [domain, service] = fullServiceName.split('.')

	if (ws.connected) {
		try {
			console.log('HASS WS callService:', fullServiceName, data)
			//return await because if it throws, its not returned and continues down to rest as fallback.
			return await ws.callService(domain, service, data)
		} catch (err) {
			console.error('HASS WS callService error:', err)
		}
	}

	try {
		console.log('HASS REST callService:', fullServiceName, data)
		return await rest.callService(domain, service, data)
	} catch (err) {
		console.error('HASS REST callService error:', err)
	}
}
