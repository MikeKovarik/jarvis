import fs from 'fs'
import {getAbsolutePath, readJson, readYaml} from '../../lan-hub/util/util.js'

const configPath    = getAbsolutePath(import.meta.url, '../../data/config-test.json')

let config = readJson(configPath)
//let buffer = fs.readFileSync('../../data/config-test.json')
//let config = JSON.parse(buffer.toString())
config.rpName = 'WebAuthn Demo'
export default config