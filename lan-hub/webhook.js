import {app} from './server.js'
import util from 'util'
import cp from 'child_process'
import path from 'path'
import {fileURLToPath} from 'url'


const exec = util.promisify(cp.exec)

const deployScript = 'restart-app'

// Only I can trigger update by posting to webhook endpoint
const allowedSender = 'MikeKovarik'
const repoName      = 'MikeKovarik/jarvis'
const repoDir       = path.join(fileURLToPath(import.meta.url), '../../')
console.log('~ repoDir', repoDir)

function run(command) {
	console.gray(`running:`, command)
	return exec(command, {cwd: repoDir})
}

app.post('/gh-webhook', async (req, res) => {
	// We're not awaiting handler because we don't want to timeout the repose. Github would consider it errored.
	handleHook(req.body).catch(console.error)
	res.sendStatus(200)
	res.end()
})

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
	await update()
	await deploy()
}

const updateCommands = [
	// get metadata
	'git fetch origin master',
	// just in case there were some modifications outside this script
	'git reset --hard origin/master',
	// download files
	'git pull origin master --force',
]

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
		console.green('DEPLOY OK')
	} catch(err) {
		console.error(`Couldn't deploy repo`)
		console.error(err)
	}
}
