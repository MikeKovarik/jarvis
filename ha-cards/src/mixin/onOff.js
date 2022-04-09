export const onOff = Base => class extends Base {

	get isOn() {
		return this.entity?.state === 'on'
	}

	get isOff() {
		return !this.isOn
	}

/*
	turnOn = (data = {}) => {
		const {entity_id} = this
		this._hass.callService('homeassistant', 'turn_on', {entity_id, ...data})
	}

	turnOff = () => {
		const {entity_id} = this
		this._hass.callService('homeassistant', 'turn_off', {entity_id})
	}
*/

	turnOn = (data = {}) => this.callService('homeassistant', 'turn_on', data)

	turnOff = () => this.callService('homeassistant', 'turn_off')

	toggleOnOff = () => {
		return this.isOn
			? this.turnOff()
			: this.turnOn()
	}

}
