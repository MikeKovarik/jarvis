export const DEBUG = Boolean(localStorage.debug ?? localStorage.DEBUG ?? localStorage.Debug)

export const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

export const timeout = millis => new Promise(resolve => setTimeout(resolve, millis))

export const throttle = (callback, millis) => {
    let timeout = undefined
	let cachedArgs
    return (...args) => {
		cachedArgs = args
		if (!timeout) {
            timeout = setTimeout(() => {
	            callback(...cachedArgs)
                timeout = undefined
            }, millis)
        }
    }
}

const intervals = [
	{label: 'y', seconds: 31536000},
	{label: 'mo', seconds: 2592000},
	{label: 'd', seconds: 86400},
	{label: 'h', seconds: 3600},
	{label: 'm', seconds: 60},
	{label: 's', seconds: 1}
]

export function timeSince(date) {
	const seconds = Math.floor((Date.now() - date.getTime()) / 1000)
	const interval = intervals.find(i => i.seconds < seconds)
	const count = Math.floor(seconds / interval.seconds)
	return `${count}${interval.label}`
}
