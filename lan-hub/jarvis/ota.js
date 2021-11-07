
import request from 'request'
import path from 'path'
import fs from 'fs-extra'
import util from 'util'
import cp from 'child_process'
import {app} from '../http/server.js'
import {getAbsolutePath} from '../util/util.js'


/*
mos build --platform esp32
curl -v -F file=@build/fw.zip http://jarvis-iot-testlight.lan/update
*/

const exec = util.promisify(cp.exec)

app.get('/ota/:deviceName', (req, res) => {
	const {deviceName} = req.params
	console.log('OTA', deviceName)
	let uploader = new OtaUploader(deviceName)
	uploader.run()
})

class OtaUploader {

	constructor(deviceName) {
		this.deviceName = deviceName
		this.url = `http://${deviceName}.lan/update`
		this.fwBuildName = 'fw.zip'
		this.sourceFwDir = getAbsolutePath(import.meta.url, '../iot-firmware/')
		this.tempFwDir = getAbsolutePath(import.meta.url, '../iot-firmware-temp/')
		this.fwPath = path.join(this.tempFwDir, '/build/', this.fwBuildName)
        console.log('~ this.sourceFwDir', this.sourceFwDir)
        console.log('~ this.tempFwDir  ', this.tempFwDir)
        console.log('~ this.fwPath     ', this.fwPath)
	}

	async run() {
		await this.cloneFiles()
		//await this.compile()
		//await this.upload()
	}

	async cloneFiles() {
		console.log('copying files')
		await fs.ensureDir(this.tempFwDir)
		await fs.emptyDir(this.tempFwDir)
		//await fs.copy(this.sourceFwDir, this.tempFwDir)
		console.log('copied files')
	}

	async compile() {
		console.log('compiling')
		//await exec('mos build --platform esp32', {cwd: this.tempFwDir})
		console.log('compiled')
	}

	upload() {
		const {url, fwBuildName} = this
		let fileStream = fs.createReadStream(this.fwPath)
		return new Promise((resolve, reject) => {
			console.log('uploading')
			var formData = {
				name: 'file',
				file: {
					value: fileStream,
					options: {
						filename: fwBuildName,
						contentType: 'application/octet-stream'
					}
				}
			}
			request.post({url, formData}, (err, res, body) => {
				if (err) {
					console.log('failed uploading')
					reject(err)
				} else {
					console.log('uploaded')
					resolve(body)
				}
			})
		})
	}

}


new OtaUploader('jarvis-iot-testlight').run()

/*
mos build --platform esp32
curl -v -F file=@build/fw.zip http://jarvis-iot-testlight.lan/update
*/