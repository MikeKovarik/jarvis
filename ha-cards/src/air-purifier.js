import {LitElement, html, css} from 'lit'
import {mixin, hassData, onOffControls} from './mixin/mixin.js'


class AirPurifierCard extends mixin(LitElement, hassData, onOffControls) {

	static entityType = 'fan'

	get color() {
		const value = Number(this.state.pm2_5?.state)
		if (value === null | value === undefined)
			return '255, 255, 255' // '0, 0, 0'
		else if (value >= 200)
			return '255, 0, 0'
		else if (value >= 75)
			return '255, 215, 0'
		else
			return '50,205,50'
	}

	get on() {
		return this.state.fan?.state === 'on'
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
						preset_mode: ${state.fan?.attributes?.preset_mode}
						${state.fan?.attributes?.preset_modes.map(mode => html`<button @click=${() => this.setMode(mode)}>${mode}</button>`)}
					</div>
					<div>
						min: ${state.favorite_motor_speed?.attributes?.min}
						max: ${state.favorite_motor_speed?.attributes?.max}
						step: ${state.favorite_motor_speed?.attributes?.step}
					</div>
				</div>

				<div class="slider">
					<div class="key-val rpm">
						<strong>${state.pm2_5?.state}</strong>
						<span>${state.pm2_5?.attributes?.unit_of_measurement}</span>
					</div>
					<div class="key-val">
						<strong>${state.motor_speed?.state}</strong>
						<span>${state.motor_speed?.attributes?.unit_of_measurement}</span>
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

	onHold = () => this._turnOff()

	setMode = preset_mode => this.turnOn({preset_mode})

}

customElements.define('air-purifier-card', AirPurifierCard)