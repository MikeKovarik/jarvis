import actions from './actions.js'
import {getAbsolutePath, readAndWatchYaml} from '../util/util.js'
import {scenes, setScene} from '../hass/scenes.js'
//import * as scenes from '../shared/scenesLegacy.js'
//const setScene = scenes.set


let triggerTuples = []

let filePath = getAbsolutePath(import.meta.url, '../../data/triggers.yaml')

const ACTION_LEFT = 'arrow_left_click'
const ACTION_RIGHT = 'arrow_right_click'
const ACTION_ON = 'on'
const ACTION_OFF = 'off'

const unregisterTuples = () => triggerTuples.forEach(tuple => actions.off(...tuple))
const registerTuples   = () => triggerTuples.forEach(tuple => actions.on(...tuple))

readAndWatchYaml(filePath, triggers => {
	unregisterTuples()
	triggerTuples = triggers.map(handleTrigger).flat()
	registerTuples()
	console.log('triggers updated')
})


function handleTrigger({source, scenes, ...triggers}) {
	source = [source].flat()
	return scenes
		? [...handleSceneArray(source, scenes), ...handleSingleScene(source, triggers)]
		: handleSingleScene(source, triggers)
}

function handleSingleScene(sources, triggers) {
	const tuples = []
	for (let source of sources)
		for (let [action, sceneId] of Object.entries(triggers))
			tuples.push([action, source, () => setScene(sceneId)])
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
		let sceneId = triggerScenes[index]
		setScene(sceneId)
	}
	for (let source of sources) {
		tuples.push([ACTION_ON,  source, resetIndex])
		tuples.push([ACTION_OFF, source, resetIndex])
		tuples.push([ACTION_LEFT,  source, () => updateIndex(-1)])
		tuples.push([ACTION_RIGHT, source, () => updateIndex(+1)])
	}
	return tuples
}