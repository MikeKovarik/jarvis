import {LitElement, html, css} from 'lit'
import {mixin, eventEmitter} from './mixin/mixin.js'
import {clamp} from './util/util.js'


const sliderCore = Base => class extends Base {

	vertical = false
	inverted = false
	min = 0
	max = 100
	step = 1
	suffix = '%'
	hideValue = false
	haptic = true

	get maxFromZero() {
		return this.max - this.min
	}

	static properties = {
		vertical: {type: Boolean},
		inverted: {type: Boolean},
		disabled: {type: Boolean},
		value: {type: Number},
		min: {type: Number},
		max: {type: Number},
		step: {type: Number},
		suffix: {type: String},
		hideValue: {type: Boolean},
		formatValue: {type: Function},
		haptic: {type: Boolean},
	}

}

const clickThreshold = 300

class AwesomeSlider extends mixin(LitElement, sliderCore, eventEmitter) {

	constructor() {
		super()
		setTimeout(() => {
			this.$status = this.renderRoot?.querySelector('#status')
			this.$value = this.renderRoot?.querySelector('#value')
			this.$slotStart = this.renderRoot?.querySelector('slot[name="start"]')
			this.$slotEnd   = this.renderRoot?.querySelector('slot[name="end"]')
		})
	}

	static styles = css`
		:host {
			display: block;
			position: relative;
			overflow: hidden;
			align-items: center;
			touch-action: var(--slider-touch-action);
		}
		:host, * {
			box-sizing: border-box;
		}
		:host([disabled]) {
			opacity: 0.4;
			pointer-events: none;
		}

		:host {
			width: 200px;
			height: 32px;
		}
		:host([vertical]) {
			width: 32px;
			height: 200px;
		}

		#status,
		#overlay {
			position: absolute;
			inset: 0;
		}

		:host {
			background-color: var(--slider-bg-color,
				rgba(
					var(--slider-bg-color-rgb, var(--color-rgb)),
					var(--slider-bg-color-opacity, 0.08)
				)
			);
		}

		#status {
			background-color: var(--slider-status-color,
				rgba(
					var(--slider-status-color-rgb, var(--color-rgb)),
					var(--slider-status-color-opacity, 0.08)
				)
			);

			will-change: transform;
			transform: var(--slider-status-transform);
			transform-origin: var(--slider-status-transform-origin);
		}

		#overlay {
			padding: inherit;
			display: flex;
			flex-direction: var(--slider-overlay-flex-direction);
			align-items: inherit;
			justify-content: space-between;
		}
			#value {
				pointer-events: none;
			}

		slot {
			pointer-events: none;
		}
	`

	updated(props) {
		if (props.has('vertical') || props.has('inverted'))
			this.applyOrientation()
	}

	applyOrientation() {
		const touchAction     = this.vertical ? 'pan-x' : 'pan-y'
		const transformOrigin = this.inverted ? 'bottom right' : 'top left'
		const flexDirection   = (this.vertical ? 'column' : 'row') + (this.inverted ? '-reverse' : '')

		this.style.setProperty('--slider-touch-action', touchAction)
		this.style.setProperty('--slider-status-transform-origin', transformOrigin)
		this.style.setProperty('--slider-overlay-flex-direction', flexDirection)
	}

	get statusTransform() {
		return this.vertical
			? `scale(1, ${this.ratio})`
			: `scale(${this.ratio}, 1)`
	}

	initX = undefined
	initY = undefined

	pointerDownTime
	isDragging = undefined

	onPointerDown = e => {
		e.preventDefault()
		this.pointerDownTime = Date.now()
		if (e.path.includes(this.$slotStart) || e.path.includes(this.$slotEnd)) return
		this.initX = e.x
		this.initY = e.y
		this.initValue = this.value
		this.bbox = this.getBoundingClientRect()
		this.dragValueBase = !this.vertical
			? this.initX - this.bbox.x
			: this.initY - this.bbox.y
		document.addEventListener('pointermove', this.onPointerMove)
		document.addEventListener('pointerup', this.onPointerUp)
		this.dragValidating = true
		this.isDragging = false
	}

	onPointerUp = e => {
		const timeDiff = Date.now() - this.pointerDownTime
		if (!this.isDragging && timeDiff < clickThreshold) {
			this.emit('toggle')
		} else if (this.isDragging) {
			this.onPointerMove(e, true)
			this.emit('drag-end', this.value)
			if (this.initValue !== this.value) this.emit('change', this.value)
		}
		this.resetDrag()
	}

	resetDrag = () => {
		document.removeEventListener('pointermove', this.onPointerMove)
		document.removeEventListener('pointerup', this.onPointerUp)
		this.dragValidating = undefined
		this.isDragging = undefined
		this.pointerDownTime = undefined
	}

	onPointerMove = (e, force = false) => {
		let diffPx = !this.vertical
			? e.x - this.initX
			: e.y - this.initY
		if (this.dragValidating && !force) {
			if (Math.abs(diffPx) < 15) return
			this.isDragging = true
			this.dragValidating = false
			this.emit('drag-start')
		}
		const containerSize = !this.vertical ? this.bbox.width : this.bbox.height
		let dragPx = this.dragValueBase + diffPx
		if (this.inverted) dragPx = containerSize - dragPx
		this.ratio = dragPx / containerSize
		this.emit('drag-move', this.value)
	}

	get ratio() {
		return (this.value - this.min) / this.maxFromZero
	}

	set ratio(newRatio) {
		const clampedRatio = clamp(newRatio, 0, 1)
		const rawValue = this.min + (clampedRatio * this.maxFromZero)
		const oldValue = this.value
		this.value = Math.round(rawValue / this.step) * this.step
		if (oldValue !== this.value) {
			this.emit('input', this.value)
			if (this.haptic) {
				navigator.vibrate(0)
				navigator.vibrate(1)
			}
		}
	}

	connectedCallback() {
		this.addEventListener('pointerdown', this.onPointerDown)
		this.addEventListener('pointercancel', this.resetDrag)
		super.connectedCallback()
		this.applyOrientation()
	}

	disconnectedCallback() {
		this.removeEventListener('pointerdown', this.onPointerDown)
		this.removeEventListener('pointercancel', this.resetDrag)
		super.disconnectedCallback()
	}

	render() {
		return html`
			<div id="status" style="transform: ${this.statusTransform}"></div>
			<div id="overlay">
				<slot name="start"></slot>
				${this.hideValue ? '' : html`<span id="value">${this.formatValue?.(this.value) ?? `${this.value} ${this.suffix}`}</span>`}
				<slot name="end"></slot>
			</div>
		`
	}

}


customElements.define('awesome-slider', AwesomeSlider)