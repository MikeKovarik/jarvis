import {LitElement, html, css} from 'lit'


class SlickColorWheel extends LitElement {

	static styles = css`
		:host {
			width: 280px;
			height: 280px;
			position: relative;
			display: block;
			border-radius: 50%;
			overflow: hidden;
		}

		.hue,
		.saturation {
			position: absolute;
			top: 0px;
			left: 0px;
			width: 100%;
			height: 100%;
			box-sizing: border-box;
		}

		.hue {
			filter: blur(16px);
			/*transform: rotateZ(var(--colorwheel-rotate, 0deg)) scale(1.2);*/
			transform: rotate(calc(90deg + var(--colorwheel-rotate, 0deg))) scale(1.2);
			/*background: conic-gradient(red, magenta, blue, aqua, lime, yellow, red);*/
			background: conic-gradient(red, yellow, lime, aqua, blue, magenta, red);
		}

		.saturation {
			background: radial-gradient(circle closest-side, rgb(255, 255, 255), transparent);
		}
	`

	render() {
		return html`
			<div class="hue"></div>
			<div class="saturation"></div>
		`
	}

}


customElements.define('slick-colorwheel', SlickColorWheel)