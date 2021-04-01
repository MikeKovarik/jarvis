import chalk from 'chalk'
import os from 'os'
import dns from 'dns'


export function getIp() {
	return new Promise((resolve, reject) => {
		dns.lookup(os.hostname(), (err, result) => {
			if (err) reject(err)
			else resolve(result)
		})
	})
}

export let ip
getIp().then(data => ip = data) 

function colorFactory(init, end = 0) {
	return (...args) => {
		process.stdout.write(`\x1b[${init}m`)
		console.log(...args)
		process.stdout.write(`\x1b[${end}m`)
	}
}

console.red     = colorFactory(31)
console.green   = colorFactory(32)
console.yellow  = colorFactory(33)
console.orange  = colorFactory(33)
console.blue    = colorFactory(34)
console.magenta = colorFactory(35)
console.cyan    = colorFactory(36)
console.white   = colorFactory(37)
console.gray    = colorFactory(90)

let consoleError = console.error.bind(console)
let consoleWarn  = console.warn.bind(console)
console.error = (...args) => consoleError(chalk.red(...args))
console.warn  = (...args) => consoleWarn(chalk.yellow(...args))