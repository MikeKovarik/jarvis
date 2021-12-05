import devices from '../shared/devices.js'
import {getAbsolutePath, readAndWatchJson} from '../util/util.js'


const isString = arg => typeof arg === 'string'

export let scenes = new Map

let jsonPath = getAbsolutePath(import.meta.url, '../../data/scenes.json')

readAndWatchJson(jsonPath, raw => {
	mapReplace(scenes, Object.entries(raw))
	const resolveScene = s => isString(s) ? (scenes.get(s) || {}) : s
	for (let [key, settings] of scenes) {
		if (Array.isArray(settings)) {
			while (settings.some(isString))
				settings = settings.map(resolveScene).flat()
			settings = Object.assign({}, ...settings)
			scenes.set(key, settings)
		}
	}
	console.log('scenes updated')
})

export function set(sceneName) {
	let scene = scenes.get(sceneName)
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

function mapReplace(map, newEntries) {
	map.clear()
	for (let entry of newEntries) map.set(...entry)
}
