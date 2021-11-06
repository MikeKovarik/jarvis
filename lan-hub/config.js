import {getAbsolutePath, readJson} from './util/util.js'


const configPath = getAbsolutePath(import.meta.url, '../secrets/config.json')
const dataPath   = getAbsolutePath(import.meta.url, '../data')

process.env.ZIGBEE2MQTT_DATA = dataPath

export const config = readJson(configPath)

export default config