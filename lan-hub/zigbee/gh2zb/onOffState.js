export class OnOffStateTransformer {

	static gh2zb({on}, out = {}) {
		const {value_on, value_off} = device.features.state
		out.state = on ? value_on : value_off
	}

	static zb2gh({state}, out = {}) {
		const {value_on} = device.features.state
		out.on = state === value_on
	}

}
