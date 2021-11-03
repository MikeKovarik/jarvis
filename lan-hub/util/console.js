function colorFactory(init, logger) {
	return (...args) => {
		process.stdout.write(`\x1b[${init}m`)
		logger(...args)
		process.stdout.write(`\x1b[0m`)
	}
}

let consoleLog   = console.log.bind(console)
let consoleError = console.error.bind(console)
let consoleWarn  = console.warn.bind(console)

console.red     = colorFactory(31, consoleLog)
console.green   = colorFactory(32, consoleLog)
console.yellow  = colorFactory(33, consoleLog)
console.orange  = colorFactory(33, consoleLog)
console.blue    = colorFactory(34, consoleLog)
console.magenta = colorFactory(35, consoleLog)
console.cyan    = colorFactory(36, consoleLog)
console.white   = colorFactory(37, consoleLog)
console.gray    = colorFactory(90, consoleLog)

console.error = colorFactory(31, consoleError)
console.warn  = colorFactory(33, consoleWarn)