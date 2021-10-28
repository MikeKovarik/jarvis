import fs from 'fs'
import devices from './devices.mjs'
import actions from './actions.mjs'
import path from 'path'
import {fileURLToPath} from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
let jsonPath = path.join(__dirname, '../data/scenes.json')

let all = []

handleFile(fs.readFileSync(jsonPath))

function handleFile(buffer) {
	let json = buffer.toString()
	all = JSON.parse(json)
}

export function set(sceneName) {
	console.log('SET SCENE', sceneName)
	let scene = all[sceneName]
	if (!scene) return
    console.log('~ scene', scene)
	applyScene(scene)
}

function applyScene(scene) {
	for (let [deviceName, state] of Object.entries(scene)) {
		let device = devices.getByName(deviceName)
		device?.applyState(state)
	}
}