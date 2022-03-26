import {LitElement, html, css} from 'lit'
import {styleMap} from 'lit-html/directives/style-map.js'
import {mixin, eventEmitter} from './mixin/mixin.js'


const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

const sliderCore = Base => class extends Base {

	vertical = false
	inverted = false
	min = 0
	max = 100
	step = 1
	suffix = '%'
	hideValue = false

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
	}

}

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
		#container,
		#status,
		#inside {
			position: absolute;
			inset: 0;
		}
		#container {
			background-color: rgba(var(--color), 0.08);
			overflow: hidden;
		}
		#status {
			background-color: rgba(var(--color), 0.08);
			will-change: transform;
		}
		#container,
		#inside {
			padding: inherit;
		}
		#inside {
			display: flex;
			align-items: center;
			justify-content: space-between;
		}
			#value {
				pointer-events: none;
			}
	`

	initX = undefined
	initY = undefined

	onPointerDown = e => {
		e.preventDefault()
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
		if (e.pointerType === 'touch') {
			this.dragValidating = true
		} else {
			this.startDrag()
			this.applyDrag(e)
		}
	}

	onPointerMove = e => {
		this.applyDrag(e)
		this.emit('drag-move', this.value)
	}

	onPointerUp = e => {
		this.applyDrag(e, true)
		this.emit('drag-end', this.value)
		if (this.initValue !== this.value) this.emit('change', this.value)
		this.resetDrag()
	}

	resetDrag = () => {
		document.removeEventListener('pointermove', this.onPointerMove)
		document.removeEventListener('pointerup', this.onPointerUp)
		this.dragValidating = undefined
	}

	startDrag = () => {
		this.dragValidating = false
		this.emit('drag-start')
	}

	applyDrag = (e, force = false) => {
		let diffPx = !this.vertical
			? e.x - this.initX
			: e.y - this.initY
		if (this.dragValidating && !force) {
			if (Math.abs(diffPx) < 15)
				return
			else
				this.startDrag(e)
		}
		const containerSize = !this.vertical ? this.bbox.width : this.bbox.height
		let dragPx = this.dragValueBase + diffPx
		if (this.inverted) dragPx = containerSize - dragPx
		this.ratio = dragPx / containerSize
	}

	get ratio() {
		return (this.value - this.min) / this.maxFromZero
	}

	set ratio(newRatio) {
		const clampedRatio = clamp(newRatio, 0, 1)
		const rawValue = this.min + (clampedRatio * this.maxFromZero)
		const oldValue = this.value
		this.value = Math.round(rawValue / this.step) * this.step
		if (oldValue !== this.value) this.emit('input', this.value)
	}

	get style() {
		return {
			touchAction: !this.vertical ? 'pan-y' : 'pan-x'
		}
	}

	get statusStyle() {
		return {
			transformOrigin: this.inverted ? 'bottom right' : 'top left',
			transform: !this.vertical
				? `scale(${this.ratio}, 1)`
				: `scale(1, ${this.ratio})`
		}
	}

	get insideStyle() {
		return {
			flexDirection: (this.vertical ? 'column' : 'row') + (this.inverted ? '-reverse' : '')
		}
	}

	render() {
		return html`
			<div
			id="container"
			style=${styleMap(this.style)}
			@pointerdown="${this.onPointerDown}"
			@pointercancel="${this.resetDrag}"
			>
				<div id="status" style=${styleMap(this.statusStyle)}></div>
				<div id="inside" style=${styleMap(this.insideStyle)}>
					<slot name="start"></slot>
					${this.hideValue ? '' : html`<span id="value">${this.formatValue?.(this.value) ?? `${this.value} ${this.suffix}`}</span>`}
					<slot name="end"></slot>
				</div>
			</div>
		`
	}

}


class AwesomeSliderCard extends mixin(LitElement, sliderCore) {

	static properties = {
		...AwesomeSlider.properties
	}

	static styles = css`
		:host {
			display: block;
			position: relative;
		}
		ha-card,
		awesome-slider {
			position: absolute;
			inset: 0;
			width: auto;
			height: auto;
		}
		ha-card {
			padding: 0.5rem 1rem;
			background-color: transparent;
			border-radius: 0.5rem;
			overflow: hidden;
		}
	`

	render() {
		return html`
			<ha-card>
				<awesome-slider
				.vertical="${this.vertical}"
				.inverted="${this.inverted}"
				.value=${this.value}
				.min="${this.min}"
				.max="${this.max}"
				.step="${this.step}"
				></awesome-slider>
			</ha-card>
		`
	}

}


customElements.define('awesome-slider', AwesomeSlider)
customElements.define('awesome-slider-card', AwesomeSliderCard)