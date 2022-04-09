import {LitElement, html, css} from 'lit'


const calculatePythagorean = (a, b) => Math.sqrt((a ** 2) + (b ** 2))
const calculateAngle = (a, b) => Math.atan2(a.y - b.y, a.x - b.x) * 180 / Math.PI

class SlickColorPicker extends LitElement {
/*
	connectedCallback() {
		this.addEventListener('pointerdown', this.onPointerDown)
		this.addEventListener('pointercancel', this.removeDragEvents)
		super.connectedCallback()
	}

	disconnectedCallback() {
		this.removeEventListener('pointerdown', this.onPointerDown)
		this.removeEventListener('pointercancel', this.removeDragEvents)
		super.disconnectedCallback()
	}
*/
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
		this.setPointerSize(e)
		this.onDrag(e)
		document.addEventListener('pointermove', this.onDrag)
		document.addEventListener('pointerup', this.onDragEnd)
	}

	onDrag = e => {
		const x = e.x - this.center.x
		const y = e.y - this.center.y
		const dist = Math.min(this.halfSize, calculatePythagorean(x, y))
		const hue = 90 + calculateAngle(e, this.center)
		const lightness = 100 - ((dist / this.halfSize) * 50)
		this.style.setProperty('--colorpicker-dist', dist + 'px')
		this.style.setProperty('--colorpicker-hue', hue + 'deg')
		this.style.setProperty('--colorpicker-lightness', lightness + '%')
	}

	onDragEnd = e => {
		this.removeDragEvents()
		this.resetPointerSize()
	}

	resetPointerSize = () => {
		this.setPointerSize()
	}

	setPointerSize = e => {
		this.pointerType = e?.pointerType
		this.requestUpdate()
	}

	removeDragEvents = () => {
		document.removeEventListener('pointermove', this.onDrag)
		document.removeEventListener('pointerup', this.onDragEnd)
	}

	static styles = css`
		:host {
			width: 280px;
			height: 280px;
			position: relative;
			overflow: visible;
			display: block;
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
				rotate(calc(var(--colorpicker-hue, 90deg) - 90deg))
				translate(var(--colorpicker-dist, 0px));
			background-color: hsl(
				calc(var(--colorpicker-hue, 0deg) - var(--colorwheel-rotate, 0deg)),
				100%,
				calc(var(--colorpicker-lightness, 50%))
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
			<slick-colorwheel
			@pointerdown=${this.onPointerDown}
			@pointercancel=${this.onDragEnd}
			@pointerover=${this.setPointerSize}
			@pointerleave=${this.resetPointerSize}
			@pointerout=${this.resetPointerSize}
			></slick-colorwheel>
			<div id="handle" class="${this.pointerType}"></div>
		`
	}

}


customElements.define('slick-colorpicker', SlickColorPicker)