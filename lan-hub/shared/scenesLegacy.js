import devices from './devices.js'
import {getAbsolutePath, readAndWatchJson, mapReplace} from '../util/util.js'


const isString = arg => typeof arg === 'string'

export const scenesLegacy = new Map

let jsonPath = getAbsolutePath(import.meta.url, '../../data/scenes.json')

readAndWatchJson(jsonPath, raw => {
	mapReplace(scenesLegacy, Object.entries(raw))
	const resolveScene = s => isString(s) ? (scenesLegacy.get(s) || {}) : s
	for (let [key, settings] of scenesLegacy) {
		if (Array.isArray(settings)) {
			while (settings.some(isString))
				settings = settings.map(resolveScene).flat()
			settings = Object.assign({}, ...settings)
			scenesLegacy.set(key, settings)
		}
	}
	console.log('scenesLegacy updated')
})

export function set(sceneName) {
	let scene = scenesLegacy.get(sceneName)
	console.log('set scene', sceneName/*, JSON.stringify(scene, null, 2)*/)
	if (scene) {
		for (let [deviceName, state] of Object.entries(scene))
			devices.execute(deviceName, state)
	} else if (sceneName.includes(':')) {
		let [deviceName, state] = sceneName.split(':')
		state = sanitizeNumberOrBool(state)
		devices.execute(deviceName, state)
	}
}

function sanitizeNumberOrBool(arg) {
	let num = Number(arg)
	return Number.isNaN(num) ? arg === 'true' : num
}
