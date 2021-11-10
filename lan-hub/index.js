import './jarvisCore.js'
import './zigbeeCore.js'
//import './util/gitLog.js'

process.on('unhandledRejection', error => {
	//console.log('unhandledRejection', error.message)
	console.log('unhandledRejection', error)
})