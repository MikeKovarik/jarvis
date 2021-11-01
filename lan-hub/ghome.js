import {objectSubset, objectIncludes, isNotUndefined} from './util.js'

export const TYPES = {
	SWITCH: 'action.devices.types.SWITCH',
	LIGHT:  'action.devices.types.LIGHT',
}

export const TRAITS = {
	OnOff:              'action.devices.traits.OnOff',
	Brightness:         'action.devices.traits.Brightness',
	ColorSetting:       'action.devices.traits.ColorSetting',
	TemperatureSetting: 'action.devices.traits.TemperatureSetting',
	HumiditySetting:    'action.devices.traits.HumiditySetting',
	OpenClose:          'action.devices.traits.OpenClose',
}

export const COMMANDS = {
	OnOff:              'action.devices.commands.OnOff',
	BrightnessAbsolute: 'action.devices.commands.BrightnessAbsolute',
	ColorAbsolute:      'action.devices.commands.ColorAbsolute',
}

export const PROPS = {
	OnOff:              ['on'],
	BrightnessAbsolute: ['brightness'],
	BrightnessRelative: ['brightnessRelativePercent', 'brightnessRelativeWeight'],
	ColorAbsolute:      ['color'],
}

export const ACTIONS = [{
	trait:   TRAITS.OnOff,
	props:   PROPS.OnOff,
	command: COMMANDS.OnOff,
}, {
	trait:   TRAITS.Brightness,
	props:   PROPS.BrightnessAbsolute,
	command: COMMANDS.BrightnessAbsolute,
}, {
	trait:   TRAITS.ColorSetting,
	props:   PROPS.ColorAbsolute,
	command: COMMANDS.ColorAbsolute,
}]

export function stateToActions(ghState, traits) {
	return ACTIONS
		.filter(({trait, props}) => objectIncludes(ghState, props) && traits.includes(trait))
		.map(({props, command}) => ({command, params: objectSubset(ghState, props)}))
		.filter(isNotUndefined)
}