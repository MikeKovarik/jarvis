import {LitElement, html, css, render} from 'lit'
import {styleMap} from 'lit-html/directives/style-map.js'
import {mixin} from './util.js'


const clamp = (num, min, max) => Math.min(Math.max(num, min), max)

const sliderCore = Base => class extends Base {

	vertical = false
	inverted = false
	min = 0
	max = 100
	step = 1

	get maxFromZero() {
		return this.max - this.min
	}

	static properties = {
		vertical: {type: Boolean},
		inverted: {type: Boolean},
		value: {type: Number},
		min: {type: Number},
		max: {type: Number},
		step: {type: Number},
	}

}

class AwesomeSlider extends mixin(LitElement, sliderCore) {

	constructor() {
		super()
		setTimeout(() => {
			this.$status = this.renderRoot?.querySelector('#status')
			this.$value = this.renderRoot?.querySelector('#value')
		})
	}

	static styles = css`
		:host {
			display: block;
			position: relative;
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
		#status {
			position: absolute;
			inset: 0;
		}
		#container {
			background-color: rgba(var(--color), 0.1);
			overflow: hidden;
		}
		#status {
			background-color: rgba(var(--color), 0.1);
			will-change: transform;
		}
	`

	initX = undefined
	initY = undefined
	lastPointerDown = undefined
	pointerHoldTimeout = undefined
	pointerHoldTime = 1000

	onPointerDown = e => {
		e.preventDefault()
		this.initX = e.x
		this.initY = e.y
		this.startPointer()
	}

	startPointer = () => {
		document.addEventListener('pointermove', this.onPointerMove)
		document.addEventListener('pointerup', this.onPointerUp)
		this.pointerHoldTimeout = setTimeout(this.onHoldTimeout, this.pointerHoldTime)
		this.lastPointerDown = Date.now()
		this.dragValidating = true
	}

	onHoldTimeout = () => {
		this.resetPointer()
		this.onHold()
	}

	resetPointer = () => {
		document.removeEventListener('pointermove', this.onPointerMove)
		document.removeEventListener('pointerup', this.onPointerUp)
		clearTimeout(this.pointerHoldTimeout)
		this.lastPointerDown = undefined
		this.dragValidating = undefined
	}

	validatePointer = e => {
		this.bbox = this.getBoundingClientRect()
		clearTimeout(this.pointerHoldTimeout)
		this.dragValidating = false
		this.dragValueBase = !this.vertical
			? this.initX - this.bbox.x
			: this.initY - this.bbox.y
	}

	onPointerCancel = e => {
		this.resetPointer()
	}

	onPointerMove = e => {
		let diffPx = !this.vertical
			? e.x - this.initX
			: e.y - this.initY
		if (this.dragValidating) {
			if (Math.abs(diffPx) < 15)
				return
			else
				this.validatePointer(e)
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
		this.value = Math.round(rawValue / this.step) * this.step
	}

	onPointerUp = e => {
		const diff = Date.now() - this.lastPointerDown
		this.resetPointer()
		if (diff < 100) this.onTap()
		this.onMoveEnd(this.value)
	}

	onHold = () => {}

	onTap = () => {}

	onMoveEnd = () => {}

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

	render() {
		return html`
			<div
			id="container"
			style=${styleMap(this.style)}
			@pointerdown="${this.onPointerDown}"
			@pointercancel="${this.onPointerCancel}"
			>
				<div id="status" style=${styleMap(this.statusStyle)}></div>
				<div id="value">${this.value}</div>
				<div>${this.vertical}</div>
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