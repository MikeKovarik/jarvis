import {LitElement, html, css} from 'lit'
import {mixin} from './mixin/mixin.js'


class AwesomeButton extends mixin(LitElement) {

	static properties = {
		icon: {type: String},
	}

	static styles = css`
		:host {
			display: flex;
			align-items: center;
			justify-content: center;
			position: relative;
			width: 3rem;
			height: 3rem;
			border-radius: 0.5rem;
			--bg-opacity: 0.04;
			background-color: rgba(var(--color), var(--bg-opacity));
			color: rgb(var(--color));
		}
		mwc-ripple {
			position: absolute;
			inset: 0;
		}
		mwc-icon {
			position: absolute;
			left: 50%;
			top: 50%;
			transform: translate(-50%, -50%);
		}
	`

	render() {
		return html`
			<mwc-ripple></mwc-ripple>
			${this.icon && html`<ha-icon icon="${this.icon}"></ha-icon>`}
			<slot></slot>
		`
	}

}

customElements.define('awesome-button', AwesomeButton)