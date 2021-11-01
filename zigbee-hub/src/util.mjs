import {readFileSync} from 'fs'
import {readFile} from 'fs/promises'
import path from 'path'
import {fileURLToPath} from 'url'
import chokidar from 'chokidar'
import * as _scenes from './scenes.mjs'


export function getAbsolutePath(importMetaUrl, relativePath) {
	let filePath = fileURLToPath(importMetaUrl)
	let dirName = path.dirname(filePath)
	return path.join(dirName, relativePath)
}

export function readAndWatch(filePath, handler) {
	let watcher = chokidar.watch(filePath, { persistent: true })
	handler(readFileSync(filePath))
	watcher.on('change', async () => handler(await readFile(filePath)))
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