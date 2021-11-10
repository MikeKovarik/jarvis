import {getAbsolutePath, readJson, readYaml} from './util/util.js'


const dataPath      = getAbsolutePath(import.meta.url, '../data')
const configPath    = getAbsolutePath(import.meta.url, '../data/config.json')
const z2mConfigPath = getAbsolutePath(import.meta.url, '../data/configuration.yaml')

process.env.ZIGBEE2MQTT_DATA = dataPath

export const config = readJson(configPath)
config.z2m = readYaml(z2mConfigPath)

export default config