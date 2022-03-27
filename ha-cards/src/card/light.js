import {LitElement, html, css} from 'lit'
import {mixin, hassData, onOffControls} from '../mixin/mixin.js'
import {tempToRgb} from './../util/temp-to-rgb'


/*
type: grid
square: false
columns: 2
cards:
  - type: custom:light-card
    entity: light.bulb_office
  - type: custom:light-card
    entity: light.bulb_office
  - type: custom:light-card
    entity: light.bulb_couch
  - type: custom:light-card
    entity: light.bulb_kitchen
  - type: custom:light-card
    entity: switch.lamp_reading
*/

class LightCard extends mixin(LitElement, hassData, onOffControls) {

	static entityType = ['light', 'switch']

	transition = 0.3

	static properties = {
		transition: {type: Number},
	}

	onStateUpdate() {
		this.hasBrightness = this.entityType === 'light'
		//this.hasBrightness = (this.entity.attributes.supported_color_modes ?? []).includes('brightness')
		/*
		const {r, g, b} = tempToRgb(this.kelvin)
		this.style.setProperty('--color-rgb', [r, g, b].join(', '))
		*/
	}

	get on() {
		return this.transitionOverrideState?.on
			?? this.entity?.state === 'on'
	}

	get brightness() {
		return this.transitionOverrideState?.brightness
			?? this.dragBrightness
			?? this.entity?.attributes?.brightness
	}

	set brightness(brightness) {
		this.turnOn({brightness})
	}

	dragBrightness = undefined

	onDragMove = ({detail}) => {
		this.dragBrightness = detail
		this.requestUpdate('dragBrightness')
	}

	onDragEnd = ({detail}) => {
		this.dragBrightness = undefined
		this.requestUpdate('dragBrightness')
		this.brightness = detail
	}

	// State changes a couple of times during transition. Here we store desired target value
	// to be shown during transition. This prevents the slider to chaoticaly jump between values.
	transitionOverrideState
	clearTransitionOverrideState = () => this.transitionOverrideState = undefined

	turnOn = (data = {}) => {
		const {transition} = this
		this.callService('light', 'turn_on', {transition, ...data})
		this.transitionOverrideState = {...data, on: true}
		clearTimeout(this.overrideValueTimeout)
		this.overrideValueTimeout = setTimeout(this.clearTransitionOverrideState, transition * 1000 * 1.25)
	}

	turnOff = (data = {}) => {
		const {transition} = this
		this.callService('light', 'turn_off', {transition, ...data})
		this.transitionOverrideState = {...data, on: false}
		clearTimeout(this.overrideValueTimeout)
		this.overrideValueTimeout = setTimeout(this.clearTransitionOverrideState, transition * 1000 * 1.25)
	}

	get icon() {
		return this.entityType === 'light'
			? (this.on ? 'mdi:lightbulb' : 'mdi:lightbulb-outline')
			: (this.on ? 'mdi:toggle-switch-variant' : 'mdi:toggle-switch-variant-of')
	}

	static styles = css`
		.light,
		.switch {
			/* looks good on #000 background, but not on gray
			--slider-bg-color-rgb: 158, 164, 184;
			--slider-bg-color-opacity: 0.2;
			*/
			--slider-bg-color-rgb: 158, 164, 184;
			--slider-bg-color-opacity: 0.08;
			/*
			*/
		}

		.light {
			--color-fg-rgb: 248, 227, 157; /* 35% brightned */
			--slider-status-color-rgb: 250, 212, 97;
			--slider-status-color-opacity: 0.15;
		}

		.switch {
			--color-fg-rgb: 146, 179, 242;
			--slider-status-color-rgb: 255, 255, 255;
			--slider-status-color-opacity: 0.12;
		}

		.off {
			--color-fg-rgb: 230, 230, 230;
			--color-fg-opacity: 0.6;
		}
		.on {
			--color-fg-opacity: 1;
		}

		:host {
			--gap: 1rem;
			display: block;
			width: 200px;
			height: 80px;
			position: relative;
		}

		ha-card {
			--color-fg: rgb(var(--color-fg-rgb), var(--color-fg-opacity));
			background-color: transparent;
		}

		ha-card,
		awesome-slider {
			width: unset;
			height: unset;
			position: absolute;
			inset: 0;
		}

		ha-card {
			padding: 0rem;
			overflow: hidden;
		}

		awesome-slider {
			padding: var(--gap);
			align-items: flex-start;
		}

		awesome-card-title {
			color: var(--color-fg);
		}
	`

	render() {
		const {entity, state} = this

		return html`
			<ha-card class="${this.entityType} ${this.on ? 'on' : 'off'}">
				<awesome-slider
				value="${this.hasBrightness ? this.brightness : this.on ? 1 : 0}"
				min="0"
				max="${this.hasBrightness ? 255 : 1}"
				step="${1}"
				@drag-move="${this.onDragMove}"
				@drag-end="${this.onDragEnd}"
				hideValue
				>
					<div slot="start">
						<awesome-card-title
						icon="${this.icon}"
						title="${this.config.name ?? entity?.attributes?.friendly_name}"
						>
							${entity?.state}
							${this.on && this.hasBrightness ? formatValue(this.brightness) + '%' : ''}
						</awesome-card-title>
					</div>
				</awesome-slider>
			</ha-card>
		`
	}

}

const formatValue = val => Math.round(val / 255 * 100)

customElements.define('light-card', LightCard)