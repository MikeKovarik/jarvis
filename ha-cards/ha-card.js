(() => {
	const {LitElement, html, css} = window.lit

	class HaCard extends LitElement {

		static styles = css`
			:host {
				display: block;
				border-radius: 6px;
				box-shadow: 0 1px 4px rgba(0,0,0,0.4);
				background-color: rgba(255, 255, 255, 0.04);
			}
		`

		render() {
			return html`<slot></slot>`;
		}

	}

	customElements.define('ha-card', HaCard)
})();