export const onOff = Base => class extends Base {

	get isOn() {
		return this.entity?.state === 'on'
	}

	get isOff() {
		return !this.isOn
	}

	turnOn = (data = {}) => this.callService('homeassistant', 'turn_on', data)

	turnOff = () => this.callService('homeassistant', 'turn_off')

	toggleOnOff = () => {
		return this.isOn
			? this.turnOff()
			: this.turnOn()
	}

}
