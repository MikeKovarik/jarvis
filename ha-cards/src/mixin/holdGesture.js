import {tapHoldThreshold, tapDragThreshold} from '../util/const.js'


export const holdGesture = Base => class extends Base {

	#timeout = undefined
	#gestureTriggered = false
	#initEvent = undefined
	#lastEvent = undefined

	connectedCallback() {
		this.addEventListener('pointerdown',   this.#onPointerDown)
		this.addEventListener('pointermove',   this.#onPointerMove)
		this.addEventListener('pointerup',     this.#onPointerUp)
		this.addEventListener('pointercancel', this.#onPointerUp)
		this.addEventListener('contextmenu',   this.#contextmenu)
		super.connectedCallback()
	}

	disconnectedCallback() {
		this.removeEventListener('pointerdown',   this.#onPointerDown)
		this.removeEventListener('pointermove',   this.#onPointerMove)
		this.removeEventListener('pointerup',     this.#onPointerUp)
		this.removeEventListener('pointercancel', this.#onPointerUp)
		this.removeEventListener('contextmenu',   this.#contextmenu)
		super.disconnectedCallback()
	}

	#onPointerDown = e => {
		clearTimeout(this.#timeout)
		this.#gestureTriggered = false
		this.#timeout = setTimeout(this.#onTimeout, tapHoldThreshold)
		this.#initEvent = e
		this.#lastEvent = e
	}

	#onPointerMove = e => {
		this.#lastEvent = e
		if (this.#gestureTriggered) e.preventDefault()
	}

	#onTimeout = () => {
		if (isWithinThreshold(this.#initEvent, this.#lastEvent, tapDragThreshold)) {
			this.emit('hold')
			this.#gestureTriggered = true
		}
		this.#clear()
	}

	#contextmenu = e => {
		if (this.#gestureTriggered) e.preventDefault()
	}

	#onPointerUp = e => {
		if (this.#gestureTriggered) e.preventDefault()
		this.#clear()
	}

	#clear = e => {
		clearTimeout(this.#timeout)
		this.#timeout = undefined
	}

}

const isWithin = (n1, n2, threshold) => Math.abs(n1 - n2) <= threshold

const isWithinThreshold = (e1, e2, threshold) => isWithin(e1.x, e2.x, threshold) && isWithin(e1.y, e2.y, threshold)