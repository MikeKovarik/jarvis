Array.prototype.promiseAll = function() {
	return Promise.all(this)
}

Promise.timeout = ms => new Promise((res) => setTimeout(res, ms))
