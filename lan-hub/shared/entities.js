import path from 'path'
import {readAndWatchYaml, EventedMap} from '../util/util.js'


export let entities = new EventedMap
export let entitiesById = new EventedMap
export let entitiesByUniqueId = new EventedMap

let filePath = path.join(process.env.HASS_PATH, '.storage/core.entity_registry')

readAndWatchYaml(filePath, raw => {
	entities.replace(raw.data.entities.map(object => [object.entity_id, object]))
	entitiesById.replace(raw.data.entities.map(object => [object.id, object]))
	entitiesByUniqueId.replace(raw.data.entities.map(object => [object.unique_id, object]))
	console.log('entities updated')
})
