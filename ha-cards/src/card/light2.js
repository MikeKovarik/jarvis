import {LitElement, html, css} from 'lit'
import {slickElement, hassData, onOff, eventEmitter, holdGesture} from '../mixin/mixin.js'
import {tempToRgb} from '../util/temp-to-rgb'
import * as styles from '../util/styles.js'
import {hexToRgb} from 'iridescent'


const isHex = string => {
	if (typeof hex !== 'string')
		return false
	if (string.startsWith('#'))
		string = string.slice(1)
	return (string.length === 3 || string.length === 6)
		&& !Number.isNaN(Number('0x' + string))
}

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

class Light2Card extends slickElement(hassData, onOff, eventEmitter, holdGesture) {

	static entityType = ['light', 'switch']

	transition = 0.3 // seconds

	static properties = {
		transition: {type: Number},
	}

	setConfig(newConfig) {
		super.setConfig(newConfig)
		let color = newConfig.color ?? newConfig.defaultColor
		if (color) {
			color = color.trim()
			if (isHex(color)) {
				this.defaultColorRgb = hexToRgb(color)
			} else {
				// not yet implemented
			}
		}
		// rgb(255, 255, 255)
		// hsl(0, 0, 0) a procenta
		// #FF00FF
		// TODO: default color
	}

	get card() {
		return this._card ?? (this._card = this.renderRoot.querySelector('ha-card'))
	}

	onStateUpdate() {
        console.log('~ onStateUpdate')
        console.log('~ this.entity', this.entity)
		//this.hasBrightness = (this.entity.attributes.supported_color_modes ?? []).includes('brightness')
		this.hasBrightness = this.entityType === 'light' // TODO
		this.hasColor = this.entity.attributes.supported_color_modes.includes('xy')
		this.hasTemp = this.entity.attributes.supported_color_modes.includes('color_temp')
		/*
		const {r, g, b} = tempToRgb(this.kelvin)
		this.style.setProperty('--color-rgb', [r, g, b].join(', '))
		*/
		const {attributes} = this.entity
        //console.log('~ attributes', attributes)
		//console.log('~ attributes.color_mode', attributes.color_mode)
		console.log('rgb_color', attributes.rgb_color)
		console.log('hs_color', attributes.hs_color)
		if (attributes.color_mode === 'xy') {
			const rgbString = attributes.rgb_color.join(',')
			const [hue, saturation] = attributes.hs_color
			// TODO:find a way to move this logic to :host. for now it's not user-friendly
			setTimeout(() => {
    	        console.log('~ this.card', this.card)
				//this.card?.style.setProperty('--color-fg', `rgb(${rgbString})`)
				this.style.setProperty('--color-fg', `hsl(${hue}, ${saturation * 0.9}%, 70%)`)
			})
			this.style.setProperty('--slider-bg-color-rgb', rgbString)
			this.style.setProperty('--slider-status-color-rgb', rgbString)
		}
	}

	connectedCallback() {
		this.on('hold', this.onHold)
		this.on('hold-end', this.onHoldEnd)
		super.connectedCallback()
	}

	disconnectedCallback() {
		this.off('hold', this.onHold)
		this.off('hold-end', this.onHoldEnd)
		super.disconnectedCallback()
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

	// OFFLINE: this.entity.attributes.linkquality === null
	get isOn() {
		return this.transitionOverrideState?.isOn
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

	// -------------------- HOLD GESTURE

	isHolding = false

	onHold = ({x, y}) => {
		this.isHolding = true
		const bbox = this.getBoundingClientRect()
		this.style.setProperty('--colorpicker-x', (x - bbox.x) + 'px')
		this.style.setProperty('--colorpicker-y', (y - bbox.y) + 'px')
		this.colorPicker = this.renderRoot.querySelector('slick-colorpicker')
		this.colorPicker.style.display = 'block'
		const fakeEvent = {x, y, preventDefault: noop}
		this.colorPicker.onPointerDown(fakeEvent)
	}

	onHoldEnd = () => {
		this.isHolding = false
		console.log('onHoldEnd')
		this.colorPicker.style.display = 'none'
	}

	// ------------------------------

	dragBrightness = undefined

	onDragMove = ({detail}) => {
	    console.log('onDragMove', detail)
		this.dragBrightness = detail
		this.requestUpdate('dragBrightness')
	}

	onDragEnd = ({detail}) => {
		this.dragBrightness = undefined
		this.requestUpdate('dragBrightness')
		this.brightness = detail
	}

	onToggle = () => this.toggleOnOff()

	// State changes a couple of times during transition. Here we store desired target value
	// to be shown during transition. This prevents the slider to chaoticaly jump between values.
	transitionOverrideState
	clearTransitionOverrideState = () => this.transitionOverrideState = undefined

	turnOn = (data = {}) => {
		if (this.entityType === 'light') {
			const {transition, defaultColorRgb} = this
			const rgb_color = defaultColorRgb ? `[${defaultColorRgb.join(',')}]` : undefined
			this.callService('light', 'turn_on', {transition, rgb_color, ...data})
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

		slick-colorpicker {
			box-shadow: 0 8px 16px rgba(0,0,0,0.6);
			width: 120px;
			height: 120px;
			z-index: 999;
			position: absolute;
			left: var(--colorpicker-x, 50%);
			top:  var(--colorpicker-y, 50%);
			transition: 120ms transform cubic-bezier(0.0, 0.0, 0.2, 1);
			transform: translate(-50%, -50%);
			display: none;
		}
	`,
	styles.sliderCard2,
	]

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
		if (!this.isOn) return
		return this.hasBrightness && this.dragBrightness !== undefined
			? formatBrightness(this.brightness)
			: formatWattage(this.state.power?.state)
	}

	//this.entity.supported_color_modes = ['color_temp', 'xy']

	render() {
		const {entity, config, state} = this
        //console.log('~ state', JSON.stringify(state))

		const safeValue = this.hasBrightness
			? this.isOn ? this.brightness : 0
			: this.isOn ? 1 : 0

		const className = entity.attributes.color_mode === 'xy'
			? 'color'
			: this.entityType

		return html`
			${this.hasColor && html`<slick-colorpicker></slick-colorpicker>`}
			<ha-card class="${className} ${this.isOn ? 'on' : 'off'}">
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
						<!--
						color_mode: ${JSON.stringify(entity.attributes.color_mode)}
						<br>
						color_temp: ${JSON.stringify(entity.attributes.color_temp)}
						<br>
						color: ${JSON.stringify(entity.attributes.color)}
						<br>
						rgb_color: ${JSON.stringify(entity.attributes.rgb_color)}
						<br>
						hs_color: ${JSON.stringify(entity.attributes.hs_color)}
						<br>
						xy_color: ${JSON.stringify(entity.attributes.xy_color)}
						-->
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

const noop = () => {}

const formatBrightness = val => val !== undefined ? Math.round(val / 255 * 100) + '%' : ''
const formatWattage = watts => watts !== undefined ? `${watts} W` : ''

customElements.define('light2-card', Light2Card)