import {clamp} from '../../util/util.js'


const brightnessMinGh = 0
const brightnessMaxGh = 100

export class BrightnessTransformer {

	static gh2zb({brightness}, out = {}) {
		const {value_max} = device.features.brightness
		out.brightness = Math.round((brightness / 100) * value_max)
	}

	static zb2gh({brightness}, out = {}) {
		const {value_max} = device.features.brightness
		let float = (brightness / value_max) * brightnessMaxGh
		let round = Math.round(float)
		return clamp(round, brightnessMinGh + 1, brightnessMaxGh)
	}

}
