export const onOffControls = Base => class extends Base {
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
	turnOn = (data = {}) => {
		this.callService('homeassistant', 'turn_on', data)
	}

	turnOff = () => {
		this.callService('homeassistant', 'turn_off')
	}

	toggleOnOff = () => {
		if (this.on)
			this.turnOff()
		else
			this.turnOn()
	}

}