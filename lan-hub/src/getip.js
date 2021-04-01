import os from 'os'
import dns from 'dns'

function getIp() {
	return new Promise((resolve, reject) => {
		dns.lookup(os.hostname(), (err, result) => {
			if (err) reject(err)
			else resolve(result)
		})
	})
}

getIp().then(console.log)