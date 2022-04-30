import {throttle} from '../util/util.js'
//import {eventEmitter} from './eventEmitter.js'


export const resizeObserver = Base => class extends Base {

	//static dependencies = [eventEmitter]

	#resizeObserver = undefined
	#isFirstResize = true

	#assignBbox({width, height}) {
		this.width = width
		this.height = height
	}

	connectedCallback() {
		super.connectedCallback()
		this.#assignBbox(this.getBoundingClientRect())
		this.#resizeObserver = new ResizeObserver(this.#onResize)
		this.#resizeObserver.observe(this)
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		this.#resizeObserver.unobserve(this)
	}

	#onResize = throttle(([entry]) => {
		/*
		if (this.#isFirstResize) {
			this.#isFirstResize = false
			return
		}
		*/
		const oldWidth = this.width
		this.#assignBbox(entry.contentRect)
		this.onResize?.()
		//this.emit('resize', {width, height})
		if (this.#didCrossBreakpoint(this.width, oldWidth))
			this.requestUpdate()
	}, 20)

	#didCrossBreakpoint(newWidth, oldWidth) {
		for (let b of this.breakpoints) {
			if (oldWidth < b && newWidth >= b) return true
			if (newWidth < b && oldWidth >= b) return true
		}
		return false
	}

}
