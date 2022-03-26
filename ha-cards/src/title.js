import {LitElement, html, css} from 'lit'
import {styleMap} from 'lit-html/directives/style-map.js'
import {mixin} from './mixin/mixin.js'


class AwesomeCardTitle extends mixin(LitElement) {

	static properties = {
		icon: {type: String},
	}

	static styles = css`
		:host {
			font-weight: 500;
			display: flex;
			align-items: center;
		}
		ha-icon {
			margin-right: 0.25rem;
		}
	`

	render() {
		return html`
			<ha-icon icon="${this.icon}"></ha-icon>
			<slot></slot>
		`
	}

}

customElements.define('awesome-card-title', AwesomeCardTitle)