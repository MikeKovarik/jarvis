import express from 'express'
import sharp from 'sharp'
import fs from 'fs'
import {pipeline} from 'stream/promises'


const router = express.Router()

export default router

router.post('/:entity', async (req, res) => {
	const {entity} = req.params
	console.log('entity', entity)
	const filePath = `./${entity}.jpg`
	console.log('filePath', filePath)

	//req.on('data', console.log)
	//req.on('end', () => console.log('end'))

	const writeStream = fs.createWriteStream(filePath)
	const resizeStream = sharp()
		.resize(1000, 1000, {
			fit: sharp.fit.inside,
			withoutEnlargement: true
		})
		.withMetadata() // needed for rotation
		.jpeg()

	try {
		await pipeline(
			req,
			resizeStream,
			writeStream
		)
		res.status(200)
	} catch {
		res.status(500)
	}
	res.send()
})