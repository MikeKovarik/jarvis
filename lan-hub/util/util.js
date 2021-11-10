import {readFileSync} from 'fs'
import {readFile} from 'fs/promises'
import path from 'path'
import {fileURLToPath} from 'url'
import chokidar from 'chokidar'
import YAML from 'yaml'
import '../util/proto.js'

export const HOSTNAME_PREFIX = 'jarvis-iot-'

export function getAbsolutePath(importMetaUrl, relativePath) {
	let filePath = fileURLToPath(importMetaUrl)
	let dirName = path.dirname(filePath)
	return path.join(dirName, relativePath)
}

export function readYaml(filePath, cb) {
	let handler = handlerFactory(filePath, cb, YAML)
	return handler(readFileSync(filePath))
}

export function readJson(filePath, cb) {
	let handler = handlerFactory(filePath, cb, JSON)
	return handler(readFileSync(filePath))
}

export function readAndWatchJson(filePath, cb) {
	let handler = handlerFactory(filePath, cb, JSON)
	let watcher = chokidar.watch(filePath, { persistent: true })
	watcher.on('change', async () => {
		// need to wait for file to save properly
		await Promise.timeout(100)
		handler(await readFile(filePath))
	})
	return handler(readFileSync(filePath))
}

function handlerFactory(filePath, cb, parser = JSON) {
	return buffer => {
		let json
		try {
			json = parser.parse(buffer.toString())
		} catch {
			console.error('error parsing', filePath)
		}
		if (cb && json) cb(json)
		return json
	}
}

export const clamp = (val, min, max) => Math.min(Math.max(val, min), max)

export const unique = arr => Array.from(new Set(arr))

export const isNotUndefined = arg => arg !== undefined

export function objectSubset(object, props) {
	return Object.fromEntries(props.map(prop => [prop, object[prop]]))
}

export function objectIncludes(object, props) {
	return props
		.map(prop => object[prop])
		.some(isNotUndefined)
}

export class Resolvable extends Promise {

	constructor(callback) {
		let args
		super((..._args) => {
			args = _args
			if (callback) callback()
		})
		const [resolve, reject] = args
		this.resolved = false
		this.rejected = false
		this.resolve = arg => {
			this.resolved = true
			resolve(arg)
		}
		this.reject = arg => {
			this.rejected = true
			reject(arg)
		}
	}

    static get [Symbol.species]() {
        return Promise
    }

    get [Symbol.toStringTag]() {
        return 'Resolvable'
    }

}

// is this still needed?
export async function callWithExpBackoff(fn, attempt = 0, maxAttempts = 7) {
	try {
		return await fn()
	} catch(e) {
		if (attempt > maxAttempts) throw e
		await Promise.timeout(2 ** attempt * 1000)
		return callWithExpBackoff(fn, attempt + 1)
	}
}
