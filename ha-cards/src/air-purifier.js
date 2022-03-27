import {LitElement, html, css} from 'lit'
import {mixin, hassData, onOffControls} from './mixin/mixin.js'
import * as styles from './util/styles.js'


class AirPurifierCard extends mixin(LitElement, hassData, onOffControls) {

	static entityType = 'fan'

	getCardSize = () => 1

	get on() {
		return this.state.fan?.state === 'on'
	}

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
		const {state} = this
		return this.auto
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

	get colorClass() {
		const value = Number(this.state.pm2_5?.state)
		if (!this.on || value === null || value === undefined)
			return 'neutral'
		else if (value >= 200)
			return 'red'
		else if (value >= 75)
			return 'orange'
		else
			return 'green'
	}

	static styles = [
		styles.sliderCardSizes,
		styles.sliderCard,
		styles.sliderCardButtons,
		css`
			.green   {--color-rgb: 50, 205, 50}
			.orange  {--color-rgb: 255, 215, 0}
			.red     {--color-rgb: 255, 0, 0}
			.neutral {--color-rgb: 255, 255, 255}

			.value-label + .value-label {
				margin-left: 0.5rem;
			}
		`
	]

	render() {
		const {state} = this

		// @hold="${this.turnOff}" // todo
		return html`
			<ha-card class="${this.colorClass}">
				<awesome-slider
				value="${this.speed}"
				min="${state.favorite_motor_speed?.attributes?.min}"
				max="${state.favorite_motor_speed?.attributes?.max}"
				step="${state.favorite_motor_speed?.attributes?.step}"
				@drag-move="${this.onDragMove}"
				@drag-end="${this.onDragEnd}"
				hideValue
				>
					<div slot="start">
						<awesome-card-title
						icon="mdi:air-filter"
						title="${state.fan?.attributes?.friendly_name}"
						>
							${!this.on ? 'Off' : html`
								<span class="value-label">
									<strong>${state.pm2_5?.state}</strong> µg/m³
								</span>
								<span class="value-label">
									<strong>${this.dragValue ?? this.speed}</strong> rpm
								</span>
							`}
						</awesome-card-title>
					</div>
					<div slot="end">
						<awesome-button @click=${() => this.mode = 'Auto'} icon="mdi:fan-auto" ?selected="${state.fan?.attributes?.preset_mode === 'Auto'}"></awesome-button>
						<awesome-button @click=${this.toggleOnOff} icon="mdi:power"></awesome-button>
					</div>
				</awesome-slider>
			</ha-card>
		`
	}

}

customElements.define('air-purifier-card', AirPurifierCard)