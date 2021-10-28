import { fileURLToPath } from 'url'
import path from 'path'


const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(__dirname, './data')

process.env.ZIGBEE2MQTT_DATA = dataDir