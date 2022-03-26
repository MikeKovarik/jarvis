import {LitElement, html, css} from 'lit'
import {styleMap} from 'lit-html/directives/style-map.js'
import {mixin} from './mixin/mixin.js'


class AwesomeGrid extends mixin(LitElement) {

	static properties = {
		padded: {type: Boolean},
		columns: {type: Number},
	}

	get style() {
		return {
			width: 0,
			display: 'grid',
			gap: this.padded ? '0.5rem' : 0,
			gridTemplateColumns: `repeat(${this.columns}, 1fr)`
		}
	}

	render() {
		return html`
			<div style=${styleMap(this.style)}>
				<slot></slot>
			</div>
		`
	}

}

customElements.define('awesome-grid', AwesomeGrid)