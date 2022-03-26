import {LitElement, html, css} from 'lit'
import {mixin, hassData, onOffControls} from './mixin/mixin.js'


class AirPurifierCard extends mixin(LitElement, hassData, onOffControls) {

	static entityType = 'fan'

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

	static styles = css`
		.green   {--color: 50, 205, 50}
		.orange  {--color: 255, 215, 0}
		.red     {--color: 255, 0, 0}
		.neutral {--color: 255, 255, 255}

		:host {
			display: block;
			--button-size: calc(var(--size) - (2 * var(--gap)));
		}

		:host,
		:host([size="medium"]) {
			--size: 4rem;
			--gap: 0.5rem;
		}

		:host([size="small"]) {
			--size: 3rem;
			--gap: 0.375rem;
		}

		:host([size="large"]) {
			--size: 5rem;
			--gap: 0.75rem;
		}

		ha-card {
			padding: 0rem;
			position: relative;
			height: var(--size);
			overflow: hidden;
		}

		.value-label + .value-label {
			margin-left: 0.5rem;
		}

		awesome-slider {
			width: unset;
			height: unset;
			position: absolute;
			inset: 0;
			padding: var(--gap);
		}
			awesome-slider [slot="start"] {
				pointer-events: none;
			}
			awesome-slider awesome-button {
				width: var(--button-size);
				height: var(--button-size);
				--bg-opacity: 0.14;
			}
			awesome-slider awesome-button:not([selected]) {
				--bg-opacity: 0.06;
				--color: 255, 255, 255;
			}

		[slot="end"] {
			display: flex
		}
			[slot="end"] > * + * {
				margin-left: var(--gap);
			}
	`

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
						<awesome-card-title icon="mdi:air-filter">${state.fan?.attributes?.friendly_name}</awesome-card-title>
						<div style="display: ${this.on ? '' : 'none'}">
							<span class="value-label">
								<strong>${state.pm2_5?.state}</strong>
								${state.pm2_5?.attributes?.unit_of_measurement}
							</span>
							<span class="value-label">
								<strong>${this.dragValue ?? this.speed}</strong>
								${state.motor_speed?.attributes?.unit_of_measurement}
							</span>
						</div>
						<div style="display: ${this.on ? 'none' : ''}">Off</div>
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