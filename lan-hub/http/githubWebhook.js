import util from 'util'
import cp from 'child_process'
import {app} from './server.js'
import {watchedFiles, getRootPath} from '../util/util.js'


const exec = util.promisify(cp.exec)

const deployScript = 'hub:restart'
const gitDiff = 'git diff --stat ...origin/master'

const updateCommands = [
	// get metadata
	'git fetch origin master',
	// just in case there were some modifications outside this script
	'git reset --hard origin/master',
	// download files
	'git pull origin master --force',
]

// Only I can trigger update by posting to webhook endpoint
const allowedSender = 'MikeKovarik'

function run(command) {
	console.gray(`running:`, command)
	return exec(command)
}

app.post('/gh-webhook', async (req, res) => {
	if (process.env.NODE_ENV === 'dev')
		return console.log('skipping git autoupdate in dev env')
	// We're not awaiting handler because we don't want to timeout the repose. Github would consider it errored.
	handleHook(req.body).catch(console.error)
	res.sendStatus(200)
	res.end()
})

const parseFileLine = line => line.split('|')[0].trim()
const parseFileNames = stdout => stdout.trim().split('\n').slice(0, -1).map(parseFileLine)
const getChangedFiles = () => exec(gitDiff).then(res => parseFileNames(res.stdout))
const isWatched = filePath => watchedFiles.map(getRootPath).includes(filePath)

async function handleHook(body) {
	console.log('--------------------------------------------')
	if (body.sender.login !== allowedSender) throw new Error('Incorrect user')
	if (!body.repository.full_name.startsWith(allowedSender)) throw new Error('Incorrect repo')
	console.magenta('GitHub repo UPDATED!')
	console.gray('ref:', body.ref)
	if (body.ref) {
		if (!body.ref.includes('/heads/')) return
		let branch = body.ref.split('/').pop()
		if (branch !== 'master') throw 'Not master'
	}
	const changedFiles = await getChangedFiles()
	await update()
	if (!changedFiles.every(isWatched)) {
		// only do full install & restart if other than config json changed.
		// the app handles updates of watched files and no restart is needed.
		await deploy()
	} else {
		console.gray('updating watched files')
	}
}

async function update() {
	console.magenta(`UPDATING REPO`)
	try {
		for (let command of updateCommands) await run(command)
		console.green('UPDATE OK')
	} catch(err) {
		console.error(`Couldn't update repo`)
		console.error(err)
	}
}

async function deploy() {
	console.magenta(`DEPLOYING REPO`)
	try {
		await run('npm install')
		await run(`npm run ${deployScript}`)
	} catch(err) {
		console.error(`Couldn't deploy repo`)
		console.error(err)
	}
}
