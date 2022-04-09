import {tapHoldThreshold, tapDragThreshold} from '../util/const.js'


// We somewhat adjust the constant to account for additive way of calculating move distance we're doing here.
const movementThreshold = tapDragThreshold * 1.5

// WARNING: contextmenu behaves differently on phones than on desktop (longpress touch)
// desktop: fires after pointerup
// phone:   fires while still hodlding (ie. before pointerup). after about 500-700ms

export const holdGesture = Base => class extends Base {

	#timeout = undefined
	#gestureActive = false
	#lastEvent = undefined

	#movementX = 0
	#movementY = 0

	connectedCallback() {
		this.addEventListener('pointerdown', this.#onPointerDown)
		document.addEventListener('contextmenu', this.#onContextMenu, {capture: true})
		super.connectedCallback()
	}

	disconnectedCallback() {
		this.removeEventListener('pointerdown', this.#onPointerDown)
		document.removeEventListener('contextmenu', this.#onContextMenu, {capture: true})
		super.disconnectedCallback()
	}

	#addAditionalEvents() {
		document.addEventListener('pointermove',   this.#onPointerMove, {capture: true})
		document.addEventListener('pointerup',     this.#onPointerUp, {capture: true})
		document.addEventListener('pointercancel', this.#onPointerUp, {capture: true})
	}

	#removeAditionalEvents = () => {
		document.removeEventListener('pointermove',   this.#onPointerMove, {capture: true})
		document.removeEventListener('pointerup',     this.#onPointerUp, {capture: true})
		document.removeEventListener('pointercancel', this.#onPointerUp, {capture: true})
	}

	#onContextMenu = e => {
		// WARNING: do not pair with #onPointerUp nor try to use with #gestureActive.
		// The event may fire 1) before, 2) after 3) never (if slightly moved) and is unreliable.
		// We can only safely limit the prevention to this element.
		if (e.target === this) e.preventDefault()
	}

	#onPointerDown = e => {
		this.#gestureActive = false
		clearTimeout(this.#timeout)
		this.#addAditionalEvents()
		this.#timeout = setTimeout(this.#onTimeout, tapHoldThreshold)
		this.#lastEvent = e
	}

	#onPointerMove = e => {
		if (this.#gestureActive) {
			e.preventDefault()
		} else {
			this.#movementX += Math.abs(e.movementX)
			this.#movementY += Math.abs(e.movementY)
			this.#lastEvent = e
		}
	}

	#onTimeout = () => {
		if (this.#movementX < movementThreshold && this.#movementY < movementThreshold) {
			const {x, y} = this.#lastEvent
			this.emit('hold', {x, y})
			this.#gestureActive = true
		}
		this.#clearTimeout()
	}

	#onPointerUp = e => {
		if (this.#gestureActive) {
			e.preventDefault()
			this.emit('hold-end')
		}
		this.#clearTimeout()
		this.#reset()
	}

	#clearTimeout = e => {
		clearTimeout(this.#timeout)
		this.#timeout = undefined
	}

	#reset = e => {
		this.#gestureActive = false
		this.#lastEvent = undefined
		this.#movementX = 0
		this.#movementY = 0
		this.#removeAditionalEvents()
	}

}

const isWithin = (n1, n2, threshold) => Math.abs(n1 - n2) <= threshold

const isWithinThreshold = (e1, e2, threshold) => isWithin(e1.x, e2.x, threshold) && isWithin(e1.y, e2.y, threshold)