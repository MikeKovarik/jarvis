import './ghome/auth-provider.js'
import './ghome/smarthome.js'
//import './debugdata.js'
import './githubWebhook.js'

import util from 'util'
import cp from 'child_process'

const exec = util.promisify(cp.exec)
// log last commit id
exec('git log -1 --format=%h').then(out => console.log('last commit:', out.stdout))
