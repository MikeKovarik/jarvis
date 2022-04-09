import {tapHoldThreshold, tapDragThreshold} from '../util/const.js'

// WARNING: Different behavior between desktop (with touch) & phones
// desktop: (even with touch, using hold) fires contextmenu event after pointerup
// phone:   fires contextmenu after about 500-700, while still hodlding (ie. before pointerup)

export const holdGesture = Base => class extends Base {

	#timeout = undefined
	#gestureTriggered = false
	#initEvent = undefined
	#lastEvent = undefined

	#pointerUpEventFired = undefined
	#contextMenuEventFired = undefined

	connectedCallback() {
		this.addEventListener('pointerdown', this.#onPointerDown)
		super.connectedCallback()
	}

	disconnectedCallback() {
		this.removeEventListener('pointerdown', this.#onPointerDown)
		super.disconnectedCallback()
	}

	#addAditionalEvents() {
		document.addEventListener('contextmenu',   this.#onContextMenu, {capture: true})
		document.addEventListener('pointermove',   this.#onPointerMove, {capture: true})
		document.addEventListener('pointerup',     this.#onPointerUp, {capture: true})
		document.addEventListener('pointercancel', this.#onPointerUp, {capture: true})
	}

	#removeAditionalEvents = () => {
		document.removeEventListener('contextmenu',   this.#onContextMenu, {capture: true})
		document.removeEventListener('pointermove',   this.#onPointerMove, {capture: true})
		document.removeEventListener('pointerup',     this.#onPointerUp, {capture: true})
		document.removeEventListener('pointercancel', this.#onPointerUp, {capture: true})
	}

	#onPointerDown = e => {
		this.#gestureTriggered = false
		clearTimeout(this.#timeout)
		this.#addAditionalEvents()
		this.#timeout = setTimeout(this.#onTimeout, tapHoldThreshold)
		this.#initEvent = this.#lastEvent = e
	}

	#onPointerMove = e => {
		this.#lastEvent = e
		if (this.#gestureTriggered) e.preventDefault()
	}

	#onTimeout = () => {
		if (isWithinThreshold(this.#initEvent, this.#lastEvent, tapDragThreshold)) {
			const {x, y} = this.#lastEvent
			this.emit('hold', {x, y})
			this.#gestureTriggered = true
		}
		this.#clearTimeout()
	}

	#onContextMenu = e => {
		this.#contextMenuEventFired = true
		if (this.#gestureTriggered) e.preventDefault()
		this.#reset()
		this.#tryReset()
	}

	#onPointerUp = e => {
		this.#pointerUpEventFired = true
		if (this.#gestureTriggered) {
			e.preventDefault()
			this.emit('hold-end')
		}
		this.#clearTimeout()
		// Do not reset #gestureTriggered here immediately.
		this.#tryReset()
	}

	#clearTimeout = e => {
		clearTimeout(this.#timeout)
		this.#timeout = undefined
	}

	#tryReset = e => {
		if (this.#contextMenuEventFired && this.#pointerUpEventFired)
			this.#reset()
	}

	#reset = e => {
		this.#gestureTriggered = false
		this.#removeAditionalEvents()
	}

}

const isWithin = (n1, n2, threshold) => Math.abs(n1 - n2) <= threshold

const isWithinThreshold = (e1, e2, threshold) => isWithin(e1.x, e2.x, threshold) && isWithin(e1.y, e2.y, threshold)