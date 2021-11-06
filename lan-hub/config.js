import {getAbsolutePath, readJson} from './util/util.js'


const configPath = getAbsolutePath(import.meta.url, '../secrets/config.json')
export const config = readJson(configPath)

export default config