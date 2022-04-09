import {LitElement, html, css} from 'lit'
import {mixin, eventEmitter} from '../mixin/mixin.js'


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

customElements.define('awesome-slider-card', AwesomeSliderCard)