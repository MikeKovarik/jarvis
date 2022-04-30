import express from 'express'
import flower from './flower.js'


const app = express()
const port = process.env.PORT || 3001
const ackPhrase = 'slick-card-backend'

app.use((req, res, next) => {
	console.log('/', req.method, req.url)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', '*')
    res.setHeader('Access-Control-Allow-Headers', '*')
    res.setHeader('Access-Control-Allow-Credentials', true)
    next()
})

app.use('/flower', flower)

app.get('/whoami', (req, res) => {
	res.send(ackPhrase)
})

app.listen(port, function () {
	console.log('Server is running on PORT',port)
})