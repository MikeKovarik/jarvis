import {LitElement, html, css} from 'lit'
import {mixin, hassData, onOff} from '../mixin/mixin.js'
import * as styles from '../util/styles.js'


class EnsureValue {

	requestedValue
	interval
	retriesLeft

	static from(ctx, prop, requestedValue, setter, millis, retries) {
		const key = `__${prop}_ensure`
		if (!ctx[key]) {
			const getter = () => ctx[prop]
			ctx[key] = new this(getter, setter, millis, retries)
		}
		ctx[key].request(requestedValue)
	}

	constructor(getter, setter, millis = 1500, retries = 40) {
		this.getter = getter
		this.setter = setter
		this.retries = retries
		this.millis = millis
	}

	request(requestedValue) {
		this.requestedValue = requestedValue
		this.clear()
		this.try()
		this.interval = setInterval(this.try, this.millis)
		this.retriesLeft = this.retries
	}

	clear() {
		clearInterval(this.interval)
		this.interval = undefined
		this.retriesLeft = 0
	}

	try = () => {
		this.retriesLeft--
		if (this.requestedValue === this.getter())
			this.clear()
		else
			this.setter(this.requestedValue)
		if (this.retriesLeft <= 0) this.clear()
	}

}

class AirHumidifierCard extends mixin(LitElement, hassData, onOff) {

	static entityType = 'humidifier'

	getCardSize = () => 1

	static defaultConfig = {
		showModeLabel: true,
		showOtherInfo: false,
	}

	get offline() {
		return this.state.humidifier?.state === 'unavailable'
	}

	get mode() {
		return this.state.humidifier.attributes.mode
	}

	set mode(mode) {
		if (!this.isOn) this.turnOn()
		this.callService('humidifier', 'set_mode', {mode})
	}

	toggleMode = () => this.mode = this.nextMode

	get auto() {
		return this.state.humidifier.attributes.mode === 'Humidity'
	}

	// sensor of room's current humidity
	get currentHumidity() {
		return this.state.humidity?.state
	}

	get targetHumidity() {
		const {state, dragValue, auto, on} = this
		if (dragValue !== undefined) return dragValue
		if (!on) return 0
		return auto
			? state.humidifier.attributes.humidity
			: 0
	}

	set targetHumidity(humidity) {
		if (!this.isOn) this.turnOn()
		if (!this.auto) this.mode = 'Humidity'
		this.callService('humidifier', 'set_humidity', {humidity})
		// If mode isn't set to 'Humidity', it takes up to a minute to switch to 'Humidity'.
		// Occasionaly it first switches to 'High', followed by delay and then finally 'Humidity'.
		// TODO: Some mechanism to wait for mode to change (but the watcher can be cancelled by calling
		// another sethumidity or setmode in meantime)
		//EnsureValue.from(this, 'targetHumidity', newVal, this._setTargetHumidity, 4000)
	}

	dragValue = undefined

	onDragMove = ({detail}) => {
		this.dragValue = detail
		this.requestUpdate('dragValue')
	}

	onDragEnd = ({detail}) => {
		this.dragValue = undefined
		this.requestUpdate('dragValue')
		this.targetHumidity = detail
	}

	get hasWater() {
		return this.state.water_tank_empty?.state === 'off'
	}

	get hasTank() {
		return this.state.water_tank?.state === 'on'
	}

	get error() {
		return !this.hasWater || !this.hasTank
	}

	get errorMessage() {
		if (this.offline)   return 'Offline'
		if (!this.hasWater) return 'Out of water!'
		if (!this.hasTank)  return 'Water tank removed!'
	}

	get nextMode() {
		switch (this.state.humidifier.attributes.mode) {
			case 'Low':      return 'Medium'
			case 'Medium':   return 'High'
			case 'High':     return 'Humidity'
			case 'Humidity': return 'Low'
			default:         return 'Humidity'
		}
	}

	get presetIcon() {
		switch (this.state.humidifier.attributes.mode) {
			case 'Low':      return 'mdi:fan-speed-1'
			case 'Medium':   return 'mdi:fan-speed-2'
			case 'High':     return 'mdi:fan-speed-3'
			case 'Humidity': return 'mdi:fan-auto'
			default:         return 'mdi:help-circle-outline'
		}
	}

	get colorClass() {
		if (this.offline)
			return 'neutral'
		else if (this.error)
			return 'red'
		else if (this.isOn)
			return 'cyan'
		else
			return 'neutral'
	}

	static styles = [
		styles.sliderCardSizes,
		styles.sliderCard,
		styles.sliderCard2,
		styles.sliderCardButtons,
		css`
			.cyan    {--color-rgb: 70, 180, 255}
			.red     {--color-rgb: 255, 0, 0}
			.neutral {--color-rgb: 255, 255, 255}

			.value-label + .value-label {
				margin-left: 0.5rem;
			}
		`
	]

	render() {
		const {state, errorMessage, targetHumidity} = this

		/*
			<div class="header">
				<div>
					status: ${this.isOn ? 'ON' : 'OFF'}
					${this.isOn
						? html`<button @click=${() => this.turnOff()}>OFF</button>`
						: html`<button @click=${() => this.turnOn()}>ON</button>`}
				</div>
				<div>
					humidifier.attributes.mode ${state.humidifier.attributes.mode}
					${state.humidifier?.attributes?.available_modes.map(mode => html`<button @click=${() => this.mode = mode}>${mode}</button>`)}
				</div>
				<div>humidifier.attributes.humidity: ${state.humidifier.attributes.humidity} (target)</div>
				<div>humidifier.attributes.max_humidity: ${state.humidifier.attributes.max_humidity}</div>
				<div>humidifier.attributes.min_humidity: ${state.humidifier.attributes.min_humidity}</div>
				<div>
					humidity: ${state.humidity?.state}
				</div>
			</div>
		*/
		return html`
			<ha-card class="${this.colorClass} ${this.isOn ? 'on' : 'off'}">
				<slick-slider
				value="${targetHumidity}"
				min="${state.humidifier?.attributes?.min_humidity}"
				max="${state.humidifier?.attributes?.max_humidity}"
				step="${1}"
				@drag-move="${this.onDragMove}"
				@drag-end="${this.onDragEnd}"
				@toggle="${this.toggleOnOff}"
				hideValue
				>
					<div slot="start">
						<slick-card-title
						icon="mdi:air-humidifier"
						title="${state.humidifier?.attributes?.friendly_name}"
						>
							${!this.isOn ? 'Off' : html`
								${this.config.showModeLabel ? html`
									<strong class="value-label">${this.auto ? 'Auto' : this.mode}</strong>
								` : ''}
								<span class="value-label">
									<strong>${this.currentHumidity}</strong> %
									${(this.auto && targetHumidity) ? html`
										/
										<strong>${targetHumidity}</strong> %
									` : ''}
								</span>
								${this.config.showOtherInfo ? html`
									<span class="value-label">
										<strong>${state.temperature?.state}</strong> °C
									</span>
								` : ''}
							`}

						</slick-card-title>
						<div>${errorMessage}</div>
					</div>
					<div slot="end">
						<awesome-button @click=${this.toggleMode} icon="${this.presetIcon}" style="display: ${this.offline ? 'none' : ''}"></awesome-button>
					</div>
				</slick-slider>
			</ha-card>
		`
	}

}


customElements.define('air-humidifier-card', AirHumidifierCard)