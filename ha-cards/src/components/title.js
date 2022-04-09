import {LitElement, html, css} from 'lit'
import {styleMap} from 'lit-html/directives/style-map.js'
import {mixin} from '../mixin/mixin.js'


class AwesomeCardTitle extends mixin(LitElement) {

	static properties = {
		icon: {type: String},
		title: {type: String},
		subtitle: {type: String},
	}

	static styles = css`
		.header {
			font-weight: 500;
			display: flex;
			align-items: center;
			text-transform: capitalize;
		}
			ha-icon {
				margin-right: 0.25rem;
			}
		.title {
			margin-top: 0.25rem;
			font-size: 1rem;
			opacity: 1;
		}
		.subtitle {
			margin-top: 0.125rem;
			font-size: 0.75rem;
			opacity: 0.6;
		}
	`

	render() {
		return html`
			<div class="header">
				<ha-icon icon="${this.icon}"></ha-icon>
				<slot></slot>
			</div>
			<div class="title">${this.title}</div>
			<div class="subtitle">${this.subtitle}</div>
		`
	}

}

customElements.define('awesome-card-title', AwesomeCardTitle)