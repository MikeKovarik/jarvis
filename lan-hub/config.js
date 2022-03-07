import dotenv from 'dotenv'
import {getAbsolutePath, readJson, readYaml} from './util/util.js'


let envPath = getAbsolutePath(import.meta.url, '../.env')
const [,,envType] = process.argv
if (envType) envPath += `.${envType}`

dotenv.config({path: envPath})

const dataPath      = getAbsolutePath(import.meta.url, '../data')
const configPath    = getAbsolutePath(import.meta.url, `../data/${['config', envType].filter(a => a).join('-')}.json`)
const z2mConfigPath = getAbsolutePath(import.meta.url, '../data/configuration.yaml')

process.env.ZIGBEE2MQTT_DATA = dataPath

export const config = readJson(configPath)
config.z2m = readYaml(z2mConfigPath)

export default config