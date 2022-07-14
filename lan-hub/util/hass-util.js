import fetch from 'node-fetch'
import config from '../config.js'

export const nameToEntityId = name => name.toLowerCase().replace(/\s+/g, '_')
export const sceneNameToEntityId = name => 'scene.' + nameToEntityId(name)

export const sanitizePrefix = (prefix, str) => str.startsWith(prefix) ? str : prefix + str