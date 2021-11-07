import os from 'os'
import dns from 'dns'


// todo: remove?
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