export const onOff = Base => class extends Base {

	// boolean on/off toggle
	toggle(state) {
		// homeassistant.turn_on
		// homeassistant.turn_off
		// homeassistant.update_entity
		this.hass.callService('homeassistant', 'toggle', {
			entity_id: state.entity_id
		})
	}

	setSpeed = value => {
		//this.setMode('Favorite')
		const {entity_id} = this.state.favorite_motor_speed
		this.callService('number', 'set_value', {entity_id, value})
	}

}
