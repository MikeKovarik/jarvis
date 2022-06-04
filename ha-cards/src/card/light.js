import {html, css} from 'lit'
import {slickElement, hassData, onOff, eventEmitter, holdGesture} from '../mixin/mixin.js'
import {tempToRgb} from '../util/temp-to-rgb' // ?move to iridescent?
import * as styles from '../util/styles.js'
import {throttle} from '../util/util.js'
import {hexToRgb, rgbToHsl} from 'iridescent'

const hsl2hs = ([h, s, l]) => [h, (100 - l) * 2]

const inflateHsl = ([h, s, l]) => [h * 360, s * 100, l * 100]

// ?move to iridescent?
const isHex = string => {
	if (typeof string !== 'string') return false
	if (string.startsWith('#')) string = string.slice(1)
	return (string.length === 3 || string.length === 6)
		&& !Number.isNaN(Number('0x' + string))
}

class LightCard extends slickElement(hassData, onOff, eventEmitter, holdGesture) {

	static entityType = ['light', 'switch']

	transition = 0.3 // seconds

	static properties = {
		transition: {type: Number},
		isOn: {type: String, reflect: true},
	}

	setConfig(newConfig) {
		super.setConfig(newConfig)
		let color = (newConfig.color ?? newConfig.defaultColor)?.trim?.()
		if (color && isHex(color)) {
			const {r, g, b} = hexToRgb(color)
			// iridescent uses 0-1 value range. no 0-360 degrees
			const hsl = inflateHsl(rgbToHsl([r, g, b]))
			this.defaultColor = hsl2hs(hsl)
			this.applyHsColor(this.defaultColor, '--color-default')
		}
	}

	onStateUpdate() {
		const supported_color_modes = this.entity.attributes.supported_color_modes ?? []
		this.hasColor = supported_color_modes.includes('xy')
		this.hasTemp = supported_color_modes.includes('color_temp')
		this.hasBrightness = this.hasColor || this.hasTemp || supported_color_modes.includes('brightness')
		const {color_mode, rgb_color, hs_color} = this.entity.attributes
		if (color_mode === 'xy' && rgb_color && hs_color) {
			// only apply color when not dragging (feedback loop)
			if (!this.isHolding) this.applyHsColor(hs_color)
		} else if (color_mode === 'color_temp') {
			console.warn('color_mode:color_temp not yet implemented')
		}
	}

	applyHsColor([h, s] = this.entity.attributes.hs_color, name = '--color-on') {
		this.style.setProperty(name, `hsl(${h}, ${s}%, 50%)`)
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
		return !!this.errorMessage
	}

	get errorMessage() {
		if (!this.entity) // todo: this is now handled in setConfig ny throwing error, but error-messages should be thought through again.
			return 'Not found'
		if (this.offline)
			return 'Offline'
	}

	// OFFLINE: this.entity.attributes.linkquality === null
	get isOn() {
		return this.transitionOverrideState?.isOn
			|| this.dragBrightness !== undefined
			|| this.entity?.state === 'on'
	}

	get offline() {
		return !this.online
	}

	get online() {
		return this.entity?.attributes
			&& 'linkquality' in this.entity?.attributes
			&& this.entity?.attributes.linkquality !== null
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

	get holdGestureEnabled() {
		return this.hasColor || this.hasTemp
	}

	onHold = ({x, y}) => {
		if (this.hasColor) {
			this.isHolding = true
			const bbox = this.getBoundingClientRect()
			this.style.setProperty('--colorpicker-x', (x - bbox.x) + 'px')
			this.style.setProperty('--colorpicker-y', (y - bbox.y) + 'px')
			this.colorPicker = this.renderRoot.querySelector('slick-colorpicker')
			this.colorPicker.style.display = 'block'
			this.colorPicker.onPointerDown({x, y, preventDefault: noop})
			//this.colorPicker.on('hsl', this.onColorPicked)
		} else if (this.hasTemp) {
			console.warn('temp not yet implemented')
		}
	}

	onHoldEnd = () => {
		if (this.hasColor) {
			this.isHolding = false
			this.colorPicker.style.display = 'none'
			//this.colorPicker.off('hsl', this.onColorPicked)
		} else if (this.hasTemp) {
			// TODO
		}
	}

	onTouchMove = e => {
		e.preventDefault()
		e.stopPropagation()
	}

	onColorPicked = throttle(({detail: hsl}) => {
		let [h, s] = hsl2hs(hsl)
		h = Math.round(h)
		s = Math.round(s)
		const currentHs = this.entity.attributes.hs_color
		if (currentHs && currentHs[0] === h && currentHs[1] === s) return
		this.callService('light', 'turn_on', {transition: 0, hs_color: [h, s]})
		this.applyHsColor([h, s])
	}, 100)

	// ------------------------------

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

	onToggle = () => this.toggleOnOff()

	// State changes a couple of times during transition. Here we store desired target value
	// to be shown during transition. This prevents the slider to chaoticaly jump between values.
	transitionOverrideState
	clearTransitionOverrideState = () => this.transitionOverrideState = undefined

	turnOn = (data = {}) => {
		if (this.entityType === 'light') {
			const {transition, defaultColor} = this
			this.callService('light', 'turn_on', {transition, hs_color: defaultColor, ...data})
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
		:host(.on) {
			--color: var(--color-on, var(--color-default));
		}
		:host(.light) {
			--color-default: rgb(250, 212, 97);
		}
		:host(.switch) {
			--color-default: rgb(146, 179, 242);
		}
		:host(.offline) {
			opacity: 0.5;
		}

		:host {
			--gap: 1rem;
			display: block;
			min-height: 6rem;
			position: relative;
		}

		ha-card,
		slick-slider {
			width: unset;
			height: unset;
			position: absolute;
			inset: 0;
		}

		ha-card {
			padding: 0rem;
			overflow: hidden;
		}

		slick-slider {
			padding: var(--gap);
			align-items: flex-start;
		}

		slick-colorpicker {
			box-shadow: 0 8px 16px rgba(0,0,0,0.6);
			width: 160px;
			height: 160px;
			z-index: 999;
			position: absolute;
			left: var(--colorpicker-x, 50%);
			top:  var(--colorpicker-y, 50%);
			transition: 120ms transform cubic-bezier(0.0, 0.0, 0.2, 1);
			transform: translate(-50%, -50%);
			display: none;
		}
	`,
	styles.sliderCardColor,
	styles.sliderCardTitle,
	]

	get icon() {
		const {config, entityType, on} = this
		if (this.error)
			return 'mdi:alert-outline'
		if (config.icon || config.iconOn || config.iconOff)
			return config.icon ?? (on ? config.iconOn : config.iconOff)
		return entityType === 'light'
			? (on ? 'mdi:lightbulb' : 'mdi:lightbulb-outline')
			: (on ? 'mdi:power-plug' : 'mdi:power-plug-outline')
	}

	get titleValue() {
		if (!this.isOn) return
		return this.hasBrightness && this.dragBrightness !== undefined
			? formatBrightness(this.brightness)
			: formatWattage(this.state.power?.state)
	}

	renderTitle() {
		if (this.error)
			return this.errorMessage
		return [
			this.errorMessage ?? this.entity?.state,
			this.titleValue,
		].join(' ')
	}

	render() {
		const {entity} = this

		this.className = [
			this.entityType,
			this.isOn ? 'on' : 'off',
			this.offline ? 'offline' : '',
		].join(' ')

		const safeValue = this.hasBrightness
			? this.isOn ? this.brightness : 0
			: this.isOn ? 1 : 0

		return html`
			${this.hasColor ? html`<slick-colorpicker @hsl="${this.onColorPicked}"></slick-colorpicker>` : null}
			<ha-card>
				<slick-slider
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
						<slick-card-title
						icon="${this.icon}"
						title="${this.config.name ?? entity?.attributes?.friendly_name}"
						>
							${this.renderTitle()}
						</slick-card-title>
					</div>
				</slick-slider>
			</ha-card>
		`
	}

}

const noop = () => {}

const formatBrightness = val => val !== undefined ? Math.round(val / 255 * 100) + '%' : ''
const formatWattage = watts => watts !== undefined ? `${watts} W` : ''

customElements.define('light-card', LightCard)