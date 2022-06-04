import Iridescent from 'iridescent'
import ColorConverter from 'cie-rgb-color-converter'


export class ColorTransformer {

	static gh2zb(gh, out = {}) {
		const temperatureK = gh?.color?.temperatureK
		if (temperatureK === undefined) return
		out.color_temp = kelvinToMiredScale(temperatureK)
	}

	static zb2gh(zb = {}, out = {}) {
		const color_temp = zb?.color?.color_temp
		if (color_temp === undefined) return
		const temperatureK = miredScaleToKelvin(color_temp)
		out.color = {temperatureK}
	}

}

// color_temp
const msMin = 153
const msMax = 555
const megaKelvin = 1000000

const kelvinToMiredScale = kelvin => clamp(Math.round((1 / kelvin) * megaKelvin), msMin, msMax)
const miredScaleToKelvin = ms     => Math.round((1 / clamp(ms, msMin, msMax)) * megaKelvin)