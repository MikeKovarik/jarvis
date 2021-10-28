import fs from 'fs'
import path from 'path'
import {fileURLToPath} from 'url'
import devices from './devices.mjs'
import actions from './actions.mjs'
import * as _scenes from './scenes.mjs'

/*
const __dirname = path.dirname(fileURLToPath(import.meta.url))
let jsonPath = path.join(__dirname, '../data/triggers.json')
handleTriggerFile(fs.readFileSync(jsonPath))

function handleTriggerFile(buffer) {
	let json = buffer.toString()
	let data = JSON.parse(json)
	console.log('data', data)
}

actions.on('arrow_left_click', 'big-button-3', () => console.log('BTN LEFT'))
actions.on('arrow_right_click', 'big-button-3', () => console.log('BTN RIGHT'))
*/

let foo = [{
	"input": ["big-button-3"],
	"scenes": ["kitchen-bulbs", "livingroom-cosy", "kitchen-dim"]
}]

for (let {input, scenes} of foo) {
	const leftAction = 'arrow_left_click'
	const rightAction = 'arrow_right_click'
	const onAction = 'on'
	const offAction = 'off'
	let index = -1
	let {length} = scenes
	for (let inputName of input) {
		const resetIndex = () => index = -1
		const updateIndex = increment => {
			if (index === -1 && increment === -1)
				index = length
			index = (length + index + increment) % length
			let sceneName = scenes[index]
			_scenes.set(sceneName)
		}
		actions.on(leftAction,  inputName, () => updateIndex(-1))
		actions.on(rightAction, inputName, () => updateIndex(+1))
		actions.on(onAction,  inputName, resetIndex)
		actions.on(offAction, inputName, resetIndex)
	}
}