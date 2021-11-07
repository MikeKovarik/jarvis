
import request from 'request'
import path from 'path'
import fs from 'fs-extra'
import util from 'util'
import cp from 'child_process'
import {app} from '../http/server.js'
import {HOSTNAME_PREFIX, getAbsolutePath} from '../util/util.js'


const exec = util.promisify(cp.exec)

app.get('/ota/:deviceName', (req, res) => {
	const {deviceName} = req.params
	let ota = new OtaUploader(deviceName)
	ota.run()
	res.status(200).send('updating')
})

class OtaUploader {

	constructor(deviceName) {
		this.deviceName = deviceName
		this.url = `http://${HOSTNAME_PREFIX}${deviceName}.lan/update`
		this.fwBuildName = 'fw.zip'
		this.sourceFwDir = getAbsolutePath(import.meta.url, '../../iot-firmware/')
		this.tempFwDir   = getAbsolutePath(import.meta.url,   `../../iot-firmware-temp-${deviceName}/`)
		this.tempBuildDir     = path.join(this.tempFwDir, '/build/')
		this.fwPath           = path.join(this.tempBuildDir, this.fwBuildName)
		this.sourceConfigPath = path.join(this.sourceFwDir, `/configs/config.${deviceName}.js`)
		this.tempConfigPath   = path.join(this.tempFwDir, `/fs/config.js`)
        console.log('sourceFwDir     ', this.sourceFwDir)
        console.log('tempFwDir       ', this.tempFwDir)
        console.log('tempBuildDir    ', this.tempBuildDir)
        console.log('fwPath          ', this.fwPath)
        console.log('sourceConfigPath', this.sourceConfigPath)
        console.log('tempConfigPath  ', this.tempConfigPath)
	}

	log(...args) {
		console.log('OTA', this.deviceName, '-', ...args)
	}

	async run() {
		try {
			this.log('STARTED')
			await this.clone()
			await this.compile()
			await this.upload()
		} catch(err) {
			this.log('FAILED')
			console.error(err)
		} finally {
			await this.cleanup()
		}
		this.log('DONE')
	}

	async clone() {
		this.log('removing previous build', this.tempFwDir)
		await fs.ensureDir(this.tempFwDir)
		await fs.emptyDir(this.tempFwDir)
		this.log('copying files')
		await fs.copy(this.sourceFwDir, this.tempFwDir)
		await fs.remove(this.tempBuildDir)
		this.log('replacing config.js')
		await fs.copy(this.sourceConfigPath, this.tempConfigPath)
	}

	async cleanup() {
		this.log('cleaning up')
		await fs.remove(this.tempFwDir)
	}

	async compile() {
		this.log('compiling')
		let platform = 'esp32'
		let cmd = `mos build --platform ${platform}`
		await exec(cmd, {cwd: this.tempFwDir})
		this.log('compiled')
	}

	upload() {
		return new Promise((resolve, reject) => {
			const {url, fwBuildName} = this
			let fileStream = fs.createReadStream(this.fwPath)
			this.log('uploading')
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
				if (err)
					reject(err)
				else
					resolve(body)
			})
		})
	}

}