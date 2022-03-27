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
		console.log(this.state)
		this.hasBrightness = this.entityType === 'brightness'
		//this.hasBrightness = (this.entity.attributes.supported_color_modes ?? []).includes('brightness')
		/*
		const {r, g, b} = tempToRgb(this.kelvin)
		this.style.setProperty('--color', [r, g, b].join(', '))
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
		:host {
			--gap: 1rem;
		}

		.light {
			--color-fg: 248, 227, 157; /* 35 brightned */
			--color-bg: 250, 212, 97;
			--color: var(--color-bg);

			--slider-status-opacity: 0.15;
			--slider-status-color: 250, 212, 97;
			--slider-bg-opacity: 0.2;
			--slider-bg-color: 158, 164, 184;
		}

		.switch {
			--color-fg: 146, 179, 242;
			--color-bg: 250, 212, 97;
			--color: var(--color-bg);
			--slider-status-opacity: 0.12;
			--slider-status-color: 255, 255, 255;
			--slider-bg-opacity: 0.2;
			--slider-bg-color: 158, 164, 184;
		}

		ha-card {
			padding: 0rem;
			position: relative;
			overflow: hidden;
			min-height: 8rem;
		}

		awesome-slider {
			width: unset;
			height: unset;
			position: absolute;
			inset: 0;
			padding: var(--gap);
			align-items: flex-start;
		}

		awesome-card-title {
			color: rgb(var(--color-fg));
		}
	`

	render() {
		const {entity, state} = this

		return html`
			<ha-card class="${this.entityType}">
				<awesome-slider
				value="${this.brightness}"
				min="0"
				max="255"
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
							${this.hasBrightness ? formatValue(this.brightness) + '%' : ''}
						</awesome-card-title>
					</div>
				</awesome-slider>
			</ha-card>
		`
	}

}

const formatValue = val => Math.round(val / 255 * 100)

customElements.define('light-card', LightCard)