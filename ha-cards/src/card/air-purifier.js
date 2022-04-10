import {LitElement, html, css} from 'lit'
import {mixin, hassData, onOff} from '../mixin/mixin.js'
import * as styles from '../util/styles.js'


class AirPurifierCard extends mixin(LitElement, hassData, onOff) {

	static entityType = 'fan'

	static defaultConfig = {
		showModeLabel: true,
		showOtherInfo: false,
	}

	getCardSize = () => 1

	get mode() {
		return this.state.fan?.attributes?.preset_mode
	}

	set mode(preset_mode) {
		this.turnOn({preset_mode})
	}

	get auto() {
		return this.mode === 'Auto'
	}

	get speed() {
		const {state, dragValue, auto, on} = this
		if (dragValue !== undefined) return dragValue
		if (!on) return 0
		return auto
			? Number(state.motor_speed?.state)
			: Number(state.favorite_motor_speed?.state)
	}

	set speed(value) {
		const {entity_id} = this.state.favorite_motor_speed
		this.callService('number', 'set_value', {entity_id, value})
		this.requestUpdate('speed') // is this needed?
	}

	dragValue = undefined

	onDragMove = ({detail}) => {
		this.dragValue = detail
		this.requestUpdate('dragValue')
	}

	onDragEnd = ({detail}) => {
		this.dragValue = undefined
		this.requestUpdate('dragValue')
		this.speed = detail
	}

	get level() {
		const value = Number(this.state.pm2_5?.state)
		if (!this.isOn || value === null || value === undefined)
			return 0
		else if (value >= 200)
			return 3
		else if (value >= 75)
			return 2
		else
			return 1
	}

	get colorClass() {
		switch (this.level) {
			case 3: return 'red'
			case 2: return 'orange'
			case 1: return 'green'
			case 0: return 'neutral'
		}
	}

	static styles = [
		styles.sliderCardSizes,
		styles.sliderCard,
		styles.sliderCardColor,
		styles.sliderCardButtons,
		styles.sliderCardTitle,
		css`
			:host(.green)   {--color: rgb(50, 205, 50)}
			:host(.orange)  {--color: rgb(255, 215, 0)}
			:host(.red)     {--color: rgb(255, 0, 0)}
			:host(.neutral) {--color: rgb(255, 255, 255)}

			.value-label + .value-label {
				margin-left: 0.5rem;
			}
		`
	]

	render() {
		const {state, mode} = this

		this.className = [
			this.colorClass,
			this.isOn ? 'on' : 'off'
		].join(' ')

		return html`
			<ha-card>
				<slick-slider
				value="${this.speed}"
				min="${state.favorite_motor_speed?.attributes?.min}"
				max="${state.favorite_motor_speed?.attributes?.max}"
				step="${state.favorite_motor_speed?.attributes?.step}"
				@drag-move="${this.onDragMove}"
				@drag-end="${this.onDragEnd}"
				@toggle="${this.toggleOnOff}"
				hideValue
				>
					<div slot="start">
						<slick-card-title
						icon="mdi:air-filter"
						title="${state.fan?.attributes?.friendly_name}"
						>
							${!this.isOn ? 'Off' : html`
								${this.config.showModeLabel ? html`
									<strong class="value-label">${mode === 'Favorite' ? 'Custom' : mode}</strong>
								` : ''}
								<span class="value-label">
									<strong>${state.pm2_5?.state}</strong>
									µg/m³
								</span>
								${this.config.showOtherInfo ? html`
									<span class="value-label">
										<strong>${this.speed}</strong> rpm
									</span>
								` : ''}
							`}
						</slick-card-title>
					</div>
					<div slot="end">
						<awesome-button @click=${() => this.mode = 'Auto'} icon="mdi:fan-auto" ?selected="${state.fan?.attributes?.preset_mode === 'Auto'}"></awesome-button>
					</div>
				</slick-slider>
			</ha-card>
		`
	}

}

customElements.define('air-purifier-card', AirPurifierCard)