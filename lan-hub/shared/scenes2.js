import path from 'path'
import {readAndWatchYaml, EventedMap} from '../util/util.js'
import {entitiesByUniqueId} from './entities.js'


export let scenes2 = new EventedMap
export let scenesById = new EventedMap

let filePath = path.join(process.env.HASS_PATH, 'scenes.yaml')

readAndWatchYaml(filePath, raw => {
	scenesById.replace(raw.map(object => [object.id, object]))
	mapScenesToEntityIds()
	console.log('scenes2 updated')
})

function mapScenesToEntityIds() {
	const entries = Array
		.from(scenesById.entries())
		.map(([, scene]) => {
			const entity = entitiesByUniqueId.get(scene.id)
			if (entity) {
				const entityId = entity.entity_id
				return [entityId, scene]
			}
		})
		.filter(a => a)
	scenes2.replace(entries)
}

entitiesByUniqueId.on('change', mapScenesToEntityIds)