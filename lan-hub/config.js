import {getAbsolutePath, readJson} from './util/util.js'


const configPath = getAbsolutePath(import.meta.url, '../data/config.json')
const dataPath   = getAbsolutePath(import.meta.url, '../data')

process.env.ZIGBEE2MQTT_DATA = dataPath

export const config = readJson(configPath)

config.ghome  = false
config.tunnel = false

export default config