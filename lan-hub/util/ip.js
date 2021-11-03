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