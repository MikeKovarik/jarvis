import {LitElement, html, css} from 'lit'
import {slickElement, eventEmitter} from '../mixin/mixin.js'


const calculatePythagorean = (a, b) => Math.sqrt((a ** 2) + (b ** 2))
const calculateAngle = (a, b) => Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI

class SlickColorPicker extends slickElement(eventEmitter) {

	connectedCallback() {
		this.addEventListener('pointerdown', this.onPointerDown)
		super.connectedCallback()
	}

	disconnectedCallback() {
		this.removeEventListener('pointerdown', this.onPointerDown)
		super.disconnectedCallback()
	}

	onPointerDown = e => {
		e.preventDefault()
		this.initX = e.x
		this.initY = e.y
		this.bbox = this.getBoundingClientRect()
		this.size = this.bbox.width
		this.halfSize = this.bbox.width / 2
		this.center = {
			x: this.bbox.x + this.halfSize,
			y: this.bbox.y + this.halfSize
		}
		this.rotate = Number(getComputedStyle(this).getPropertyValue('--colorwheel-rotate').replace('deg', '')) ?? 0
		this.setPointerSize(e)
		this.onPointerMove(e)
		this.addDragEvents()
	}

	onPointerMove = e => {
    	console.log('picker onPointerMove', e.target)
		e.preventDefault()
		const x = e.x - this.center.x
		const y = e.y - this.center.y
		const dist = Math.min(this.halfSize, calculatePythagorean(x, y))
		let hue = calculateAngle(e, this.center) - this.rotate
		if (hue < 0) hue = hue + 360
		//const hue = 90 + calculateAngle(e, this.center)
		const lightness = 100 - ((dist / this.halfSize) * 50)
		this.style.setProperty('--colorpicker-dist', dist + 'px')
		this.style.setProperty('--colorpicker-hue', hue + 'deg')
		this.style.setProperty('--colorpicker-lightness', lightness + '%')
		this.emit('hsl', [hue, 100, lightness])
	}

	onPointerUp = e => {
		this.removeDragEvents()
		this.resetPointerSize()
	}

	resetPointerSize = () => {
		this.setPointerSize()
	}

	setPointerSize = e => {
		this.pointerType = e?.pointerType
	}

	addDragEvents = () => {
		document.addEventListener('pointermove', this.onPointerMove)
		document.addEventListener('pointerup', this.onPointerUp)
		document.addEventListener('pointercancel', this.removeDragEvents)
	}

	removeDragEvents = () => {
		document.removeEventListener('pointermove', this.onPointerMove)
		document.removeEventListener('pointerup', this.onPointerUp)
		document.removeEventListener('pointercancel', this.removeDragEvents)
	}

	static styles = css`
		:host {
			width: 280px;
			height: 280px;
			display: block;
			position: relative;
			overflow: visible;
			border-radius: 50%;
			touch-action: none;
		}

		slick-colorwheel {
			position: absolute;
			top: 0px;
			left: 0px;
			width: 100%;
			height: 100%;
			box-sizing: border-box;
			touch-action: none;
			border-radius: 50%;
			overflow: hidden;
		}

		#handle {
			transition: 40ms width, 40ms height;
			pointer-events: none;
			box-sizing: border-box;
			box-shadow: 0 0 6px rgba(0,0,0,0.6);
			border: 1px solid #FFF;
			border-radius: 50%;
			top: 50%;
			left: 50%;
			position: absolute;
			transform-origin: center;
			transform:
				translate(-50%, -50%)
				rotate(calc(var(--colorpicker-hue, 0deg) + var(--colorwheel-rotate, 0deg)))
				translate(var(--colorpicker-dist, 0px));
			background-color: hsl(
				calc(var(--colorpicker-hue, 0deg)),
				100%,
				var(--colorpicker-lightness, 50%)
			);
		}

		#handle,
		#handle.mouse {
			width: 1.5rem;
			height: 1.5rem;
		}
		#handle.pen {
			width: 1rem;
			height: 1rem;
		}
		#handle.touch {
			width: 3rem;
			height: 3rem;
		}
	`

	render() {
		return html`
			<slick-colorwheel></slick-colorwheel>
			<div id="handle" class="${this.pointerType}"></div>
		`
	}

}


customElements.define('slick-colorpicker', SlickColorPicker)