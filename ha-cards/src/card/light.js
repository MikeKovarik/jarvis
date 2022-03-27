import {LitElement, html, css} from 'lit'
import {mixin, hassData, onOffControls} from '../mixin/mixin.js'
import {tempToRgb} from './../util/temp-to-rgb'
import * as styles from '../util/styles.js'


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

	transition = 0.3 // seconds

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

	get error() {
		//return !this.entity
		return !!this.errorMessage
	}

	get errorMessage() {
		if (!this.entity)
			return 'Not found'
		if ('linkquality' in this.entity.attributes && this.entity.attributes.linkquality === null)
			return 'Offline'
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

	onToggle = () => {
		this.toggleOnOff()
	}

	// State changes a couple of times during transition. Here we store desired target value
	// to be shown during transition. This prevents the slider to chaoticaly jump between values.
	transitionOverrideState
	clearTransitionOverrideState = () => this.transitionOverrideState = undefined

	turnOn = (data = {}) => {
		if (this.entityType === 'light') {
			const {transition} = this
			this.callService('light', 'turn_on', {transition, ...data})
			this.transitionOverrideState = {...data, on: true}
			clearTimeout(this.overrideValueTimeout)
			this.overrideValueTimeout = setTimeout(this.clearTransitionOverrideState, transition * 1000 * 1.25)
		} else {
			this.callService('switch', 'turn_on', data)
		}
	}

	turnOff = (data = {}) => {
		if (this.entityType === 'light') {
			const {transition} = this
			this.callService('light', 'turn_off', {transition, ...data})
			this.transitionOverrideState = {...data, on: false}
			clearTimeout(this.overrideValueTimeout)
			this.overrideValueTimeout = setTimeout(this.clearTransitionOverrideState, transition * 1000 * 1.25)
		} else {
			this.callService('switch', 'turn_off', data)
		}
	}

	static styles = [
	styles.sliderCard2,
	css`
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

		:host {
			--gap: 1rem;
			display: block;
			min-height: 8rem;
			position: relative;
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
	`]

	get icon() {
		const {config, entityType, on} = this
		if (config.icon || config.iconOn || config.iconOff) {
			return config.icon ?? (on ? config.iconOn : config.iconOff)
		} else {
			return entityType === 'light'
				? (on ? 'mdi:lightbulb' : 'mdi:lightbulb-outline')
				: (on ? 'mdi:power-plug' : 'mdi:power-plug-outline')
		}
	}

	get titleValue() {
		if (!this.on) return
		return this.hasBrightness && this.dragBrightness !== undefined
			? formatBrightness(this.brightness)
			: formatWattage(this.state.power?.state)
	}

	render() {
		const {entity, config, state} = this

		const safeValue = this.hasBrightness
			? this.on ? this.brightness : 0
			: this.on ? 1 : 0

		return html`
			<ha-card class="${this.entityType} ${this.on ? 'on' : 'off'}">
				<awesome-slider
				value="${safeValue}"
				min="0"
				max="${this.hasBrightness ? 255 : 1}"
				step="${1}"
				@drag-move="${this.onDragMove}"
				@drag-end="${this.onDragEnd}"
				@toggle="${this.onToggle}"
				hideValue
				>
					<div slot="start">
						<awesome-card-title
						icon="${this.icon}"
						title="${this.config.name ?? entity?.attributes?.friendly_name}"
						>
							${this.errorMessage ?? entity?.state}
							${this.titleValue}
						</awesome-card-title>
					</div>
					${this.error && html`
						<div slot="end">
							<ha-icon icon="mdi:alert-outline"></ha-icon>
						</div>
					`}
				</awesome-slider>
			</ha-card>
		`
	}

}

const formatBrightness = val => val !== undefined ? Math.round(val / 255 * 100) + '%' : ''
const formatWattage = watts => watts !== undefined ? `${watts} W` : ''

customElements.define('light-card', LightCard)