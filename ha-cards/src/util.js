export const mixin = (...args) => {
	const Main = args.find(arg => !!arg.prototype) ?? class {}
	const mixins = args.filter(arg => arg != Main)
	return mixins.reduce((Prev, m) => m(Prev), Main)
}

export const eventEmitter = Base => class extends Base {

	emit(name, detail) {
		this.dispatchEvent(new CustomEvent(name, {
			detail,
			bubbles: true,
			composed: true
		}))
	}

	#listeners = new Map
	#events = new Map

	on(name, cb) {
		const listener = this.#listeners.get(cb) ?? (e => cb(e.detail))
		const eventListeners = this.#events.get(name) ?? []
		eventListeners.push(listener)
		this.#listeners.set(cb, listener)
		this.#events.set(name, eventListeners)
		this.addEventListener(name, listener, {passive: true})
	}

	off(name, cb) {
		const listener = this.#listeners.get(cb)
		if (!listener) return
		const eventListeners = this.#events.get(name) ?? []
		if (!eventListeners) return
		const index = eventListeners.indexOf(listener)
		eventListeners.splice(index, 1)
		this.removeEventListener(name, listener)
	}

}