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