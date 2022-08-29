import path from 'path'
import {readAndWatchYaml, EventedMap} from '../util/util.js'
import {entitiesByUniqueId} from './entities.js'
import {sanitizePrefix} from '../util/hass-util.js'
import {callService} from './service.js'


export const scenes = new EventedMap
export const scenesById = new EventedMap

const filePath = path.join(process.env.HASS_PATH, 'scenes.yaml')

readAndWatchYaml(filePath, object => {
	const entries = object.map(object => [object.id, object])
	scenesById.replace(entries)
	mapScenesToEntityIds()
	console.log('scenes updated')
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
	scenes.replace(entries)
}

entitiesByUniqueId.on('change', mapScenesToEntityIds)

export function setScene(entityId) {
	entityId = sanitizePrefix('scene.', entityId)
	return callService('scene.turn_on', {'entity_id': entityId})
}
