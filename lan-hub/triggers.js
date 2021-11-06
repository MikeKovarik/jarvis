import actions from './actions.js'
import * as scenes from './scenes.js'
import {getAbsolutePath, readAndWatchJson} from './util/util.js'


let triggers = []
let triggerTuples = []

let jsonPath = getAbsolutePath(import.meta.url, '../data/triggers.json')

const ACTION_LEFT = 'arrow_left_click'
const ACTION_RIGHT = 'arrow_right_click'
const ACTION_ON = 'on'
const ACTION_OFF = 'off'

const unregisterTuples = () => triggerTuples.forEach(tuple => actions.off(...tuple))
const registerTuples   = () => triggerTuples.forEach(tuple => actions.on(...tuple))

readAndWatchJson(jsonPath, triggers => {
	unregisterTuples()
	triggerTuples = triggers.map(handleTrigger).flat()
	registerTuples()
	console.log('triggers updated')
})


function handleTrigger({source, scenes, ...triggers}) {
	source = [source].flat()
	if (scenes) {
		return [
			...handleSceneArray(source, scenes),
			...handleSingleScene(source, triggers),
		]
	} else {
		return handleSingleScene(source, triggers)
	}
}

function handleSingleScene(sources, triggers) {
	const tuples = []
	for (let [action, scene] of Object.entries(triggers))
		for (let source of sources)
			tuples.push([action, source, () => scenes.set(scene)])
	return tuples
}

function handleSceneArray(sources, triggerScenes) {
	const tuples = []
	let index = -1
	let {length} = triggerScenes
	const resetIndex = () => index = -1
	const updateIndex = increment => {
		if (index === -1 && increment === -1)
			index = length
		index = (length + index + increment) % length
		let sceneName = triggerScenes[index]
		scenes.set(sceneName)
	}
	for (let source of sources) {
		tuples.push([ACTION_ON,  source, resetIndex])
		tuples.push([ACTION_OFF, source, resetIndex])
		tuples.push([ACTION_LEFT,  source, () => updateIndex(-1)])
		tuples.push([ACTION_RIGHT, source, () => updateIndex(+1)])
	}
	return tuples
}