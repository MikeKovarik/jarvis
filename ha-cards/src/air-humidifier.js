import {LitElement, html, css} from 'lit'
import {AwesomeCardBase, AwesomeToggleCard} from './base.js'


class AirHumidifierCard extends AwesomeToggleCard {

	static entityType = 'humidifier'

	get hasWater() {
		return this.state.water_tank_empty?.state === 'off'
	}

	get hasTank() {
		return this.state.water_tank?.state === 'on'
	}

	get on() {
		return this.state.humidifier?.state === 'on'
	}

	get color() {
		if (!this.hasWater || !this.hasTank)
			return '255, 0, 0'
		else if (this.on)
			return '0, 0, 255'
		else
			return '255, 255, 255'
	}

	render() {
		const {state} = this

				//<div class="header" @click="${this.onClick}">
		return html`
			<ha-card style="--color: ${this.color}">
				<div class="header">
					<div>
						status: ${this.on ? 'ON' : 'OFF'}
						${this.on
							? html`<button @click=${() => this.turnOff()}>OFF</button>`
							: html`<button @click=${() => this.turnOn()}>ON</button>`}
					</div>
					<div>
						preset_mode: ${state.humidifier?.attributes?.preset_mode}
						${state.humidifier?.attributes?.available_modes.map(mode => html`<button @click=${() => this.setMode(mode)}>${mode}</button>`)}
					</div>
					<div>
						min: ${state.humidifier?.attributes?.min_humidity}
						max: ${state.humidifier?.attributes?.max_humidity}
					</div>
				</div>

				<div class="slider">
					<div class="key-val rpm">
						<strong>${state.humidity?.state}</strong>
						<span>${state.humidity?.attributes?.unit_of_measurement}</span>
					</div>
					<div class="key-val">
						<strong>${state.temperature?.state}</strong>
						<span>${state.temperature?.attributes?.unit_of_measurement}</span>
					</div>
					<div class="key-val">
						<strong>${this.hasWater ? 'has water' : 'out of water!'}</strong>
					</div>
				</div>
			</ha-card>
		`
	}

	onClick = () => {
		//const entity_id = this.state.fan.entity_id
		//this._hass.callService('homeassistant', 'toggle', {entity_id})
		//const {preset_mode} = this.state.fan?.attributes
		const preset_mode = 'Silent'
		this.setMode('Silent')
	}


}


customElements.define('air-humidifier-card', AirHumidifierCard)