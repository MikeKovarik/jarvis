import os from 'os'
import path from 'path'
import {fileURLToPath} from 'url'


export const __dirname = path.dirname(fileURLToPath(import.meta.url))
const {username} = os.userInfo()

export let localPath

if (username === 'Mike') {
	// localhost: testing only
	localPath = path.join(__dirname, '../')
} else {
	// production
	localPath = '/home/pi/.homeassistant/www/'
}

console.log('localPath', localPath)