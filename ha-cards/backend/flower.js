import express from 'express'
import sharp from 'sharp'
import {createWriteStream} from 'fs'
import fs from 'fs/promises'
import path from 'path'
import {pipeline} from 'stream/promises'
import {localPath} from './util.js'


const uploadsPath = path.join(localPath, 'flora/uploads/')
console.log('Flora uploads path:', uploadsPath)

const router = express.Router()
export default router

router.post('/:entity', async (req, res) => {
	await fs.mkdir(uploadsPath, {recursive: true}).catch(console.error)

	const filePath = path.join(uploadsPath, `${req.params.entity}.jpg`)

	const writeStream = createWriteStream(filePath)

	const resizeStream = sharp()
		.resize(1000, 1000, {
			fit: sharp.fit.inside,
			withoutEnlargement: true
		})
		.withMetadata() // needed for rotation
		.jpeg()

	try {
		await pipeline(req, resizeStream, writeStream)
		res.status(200)
	} catch {
		res.status(500)
	}

	res.send()
})

router.delete('/:entity', async (req, res) => {
	const filePath = path.join(uploadsPath, `${req.params.entity}.jpg`)

	try {
		await fs.unlink(uploadsPath)
		res.status(200)
	} catch {
		res.status(500)
	}

	res.send()
})