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

export const sliderCardColor = css`
	:host {
		background-color: transparent;
	}
	:host(.off) {
		--color: rgb(200, 200, 200);
		--text-opacity: 0.6;
		--slider-bg-opacity: 0.01;
	}
	:host(.on) {
		--text-opacity: 1;
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

export const sliderCardTitle = css`
	slick-card-title {
		color: var(--color);
		opacity: var(--text-opacity, 1);
		filter: saturate(220%) contrast(60%) saturate(70%) brightness(210%);
	}
`


// TODO: add global variable
// --slick-easing: cubic-bezier(0.4, 0.0, 0.2, 1);