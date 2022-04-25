(() => {
	const {LitElement, html, css} = window.lit

	class HaCard extends LitElement {

		static styles = css`
			:root {
				--card-background-color: #1c1c1c;
				--primary-text-color: #E1E1E1;
			}
			:host {
				display: block;
				background: var( --ha-card-background, var(--card-background-color, white) );
				border-radius: var(--ha-card-border-radius, 4px);
				box-shadow: var( --ha-card-box-shadow, 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12) );
				color: var(--primary-text-color);
				/*
				border-radius: 6px;
				box-shadow: 0 1px 4px rgba(0,0,0,0.4);
				background-color: rgba(255, 255, 255, 0.04);
				*/
			}
		`

		render() {
			return html`<slot></slot>`;
		}

	}

	customElements.define('ha-card', HaCard)
})();