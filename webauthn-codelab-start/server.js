import express from 'express'
import session from 'express-session'
import hbs from 'hbs'
import auth from './routes/auth.js'
const app = express()


const port = 8080
const secret = 'TODO'

app.set('view engine', 'html')
app.engine('html', hbs.__express)
app.set('views', './views')
app.use(express.json())
app.use(express.static('public'))

app.use(session({
    secret,
	resave: true,
	saveUninitialized: false,
    cookie: {
		secure: false,
	}
}))

app.use('/auth', auth)

app.get('/', (req, res) => {
	res.render('index.html')
})

const listener = app.listen(port, () => {
	console.log('Your app is listening on port ' + listener.address().port)
})
