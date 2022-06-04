import Iridescent from 'iridescent'
import ColorConverter from 'cie-rgb-color-converter'


export class ColorTransformer {

	static gh2zb(gh, out = {}) {
		if (!gh.color) return
		const {spectrumRGB/*, spectrumHsv*/} = gh.color
		if (spectrumRGB  !== undefined) out.color_xy   = rgbToXy(spectrumRGB)
	}

	static zb2gh({color_xy, brightness} = {}, out = {}) {
		if (color_xy === undefined || brightness === undefined) return
		out.color = {
			spectrumRgb: xyBriToRgb(xy, brightness)
		}
	}

}

// google home returns rgb value as integer (not string hex)
const rgbToXy = rgbInt => {
	const hex = rgbInt.toString(16).padStart(6, '0')
	const {r, g, b} = Iridescent.hexToRgb(hex)
	return ColorConverter.rgbToXy(r, g, b)
}

// google home accepts rgb as integer number (not object, nor hex string)
const xyBriToRgb = ({x, y}, brightness) => {
	const {r, g, b} = ColorConverter.xyBriToRgb(x, y, brightness)
	const hex = Iridescent.rgbToHex({r, g, b})
	const int = parseInt(hex.slice(1), 16)
	return int
}