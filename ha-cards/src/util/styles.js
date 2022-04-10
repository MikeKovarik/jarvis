import {css} from 'lit'


export const sliderCardSizes = css`
	:host {
		display: block;
		--button-size: calc(var(--size) - (2 * var(--gap)));
	}

	:host([size="mini"]) {
		--size: 3rem;
		--gap: 0.375rem;
	}

	:host([size="small"]) {
		--size: 4rem;
		--gap: 0.5rem;
	}

	:host,
	:host([size="medium"]) {
		--size: 5rem;
		--gap: 1rem;
	}

	:host([size="large"]) {
		--size: 6rem;
		--gap: 1rem;
	}

	ha-card {
		padding: 0rem;
		position: relative;
		height: var(--size);
		overflow: hidden;
	}
`

export const sliderCard = css`
	slick-slider {
		width: unset;
		height: unset;
		position: absolute;
		inset: 0;
		padding: var(--gap);
	}
`

export const sliderCard2 = css`
	.off {
		--color-fg-rgb: 230, 230, 230;
		--color-fg-opacity: 0.6;
	}
	.on {
		--color-fg-opacity: 1;
	}
	
	/*
	:host { TODO:find a way to move this logic to :host.
	for now it's not user-friendly
	*/
	ha-card {
		--color-fg: rgb(var(--color-fg-rgb), var(--color-fg-opacity));
		background-color: transparent;
	}
`

export const sliderCardButtons = css`
	slick-slider awesome-button {
		width: var(--button-size);
		height: var(--button-size);
		--bg-opacity: 0.14;
		pointer-events: auto;
	}
	slick-slider awesome-button:not([selected]) {
		--bg-opacity: 0.06;
		--color-rgb: 255, 255, 255;
	}

	[slot="end"] {
		display: flex
	}
		[slot="end"] > * + * {
			margin-left: var(--gap);
		}
`
