import {tapHoldThreshold, tapDragThreshold} from '../util/const.js'


export const holdGesture = Base => class extends Base {

	#timeout = undefined
	#gestureTriggered = false
	#initEvent = undefined
	#lastEvent = undefined

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
        console.log('~ removeAditionalEvents()')
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
		this.#clear()
	}

	// context menu is always triggered after pointerup, no matter the .preventDefault()
	#onContextMenu = e => {
    	console.log('~ #onContextMenu', this.#gestureTriggered)
		if (this.#gestureTriggered) e.preventDefault()
		this.#reset()
	}

	#onPointerUp = e => {
	    //console.log('~ #onPointerUp', e.type, e)
		if (this.#gestureTriggered) {
			e.preventDefault()
			this.emit('hold-end')
		}
		this.#clear()
		// Do not reset #gestureTriggered here immediately.
		// Because context menu is always triggered after pointerup, no matter the .preventDefault()
		setTimeout(this.#reset, 200)
	}

	#clear = e => {
		clearTimeout(this.#timeout)
		this.#timeout = undefined
	}

	#reset = e => {
		this.#gestureTriggered = false
		this.#removeAditionalEvents()
	}

}

const isWithin = (n1, n2, threshold) => Math.abs(n1 - n2) <= threshold

const isWithinThreshold = (e1, e2, threshold) => isWithin(e1.x, e2.x, threshold) && isWithin(e1.y, e2.y, threshold)