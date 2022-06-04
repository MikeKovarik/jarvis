import Iridescent from 'iridescent'
import ColorConverter from 'cie-rgb-color-converter'
import actions from '../shared/actions.js'
import * as zbTopics from './topics.js'
import {GhomeDevice} from '../shared/GhomeDevice.js'
import {TYPES, TRAITS} from '../ghome/const.js'
import {clamp} from '../util/util.js'
import {topics} from '../shared/mqtt.js'


const debounceTimeouts = {}

const debounce = (tag, handler, millis = 100) => {
	clearTimeout(debounceTimeouts[tag])
	debounceTimeouts[tag] = setTimeout(handler, millis)
}

const exposesAction = device => device.definition?.exposes?.some(ex => ex.name === 'action') ?? false
const notExposesAction = device => !exposesAction(device)

const pickExposedArray = (device, name) => device.definition?.exposes.find(ex => ex[name]) || {}

export class ZbDevice extends GhomeDevice {

	static getIdFromWhoami = whoami => whoami.ieee_address

	static getCtor(whoami) {
		if (Button.matches(whoami))
			return Button
		else if (Light.matches(whoami))
			return Light
		else if (Sensor.matches(whoami))
			return Sensor
		else
			return ZbDevice
	}

	static from(whoami) {
		let Ctor = this.getCtor(whoami)
		return new Ctor(whoami)
	}

	constructor(whoami) {
		super()

		this.deviceInfo.manufacturer = whoami.manufacturer,
		this.deviceInfo.model        = whoami.model_id,
		this.deviceInfo.swVersion    = whoami.software_build_id

		this.id = whoami.ieee_address
		this.injectWhoami(whoami)
	}

	unsubscribe() {
		if (super.unsubscribe()) {
			topics.off(zbTopics.renameResponse, this.onGlobalRename)
		}
	}

	subscribe() {
		if (super.subscribe()) {
			topics.on(zbTopics.renameResponse, this.onGlobalRename)
		}
	}

	injectWhoami(whoami) {
		//this.name = whoami.friendly_name
		if (this.name !== whoami.friendly_name)
			this.onRename(whoami.friendly_name)
	}

	onGlobalRename = ({data: {from, to}}) => {
		if (this.name === from) this.onRename(to)
	}

	onRename = friendlyName => {
		// skip unsubscribe on boot when we dont know the name yet
		if (this.name !== undefined) this.unsubscribe()
		this.name = friendlyName
		this.subscribe()
	}

	// ----------------------------- MQTT TOPICS

	get friendlyName() {
		return this.name
	}

	get deviceTopic() {
		return `${zbTopics.root}/${this.friendlyName}`
	}

	get availabilityTopic() {
		return `${this.deviceTopic}/availability`
	}

	get getTopic() {
		return `${this.deviceTopic}/get`
	}

	get setTopic() {
		return `${this.deviceTopic}/set`
	}

	// ------------------- COMMUNICATION WITH DEVICE -----------------------

	_stateProps = new Set

	fetchState(props = this._stateProps) {
		let entries = Array.from(props).map(prop => [prop, ''])
		let query = Object.fromEntries(entries)
		this.getQuery(query)
	}

	getQuery(query) {
		topics.emit(this.getTopic, query)
	}

	setQuery(query) {
        //console.gray('set', this.name, query)
		topics.emit(this.setTopic, query)
	}

}



export class Button extends ZbDevice {

	willReportState = false

	static matches = exposesAction

	onData(data) {
		super.onData(data)
		if (data.action === undefined) return
		// ignore battery and other non-action status updates
		let tag = `${this.name}|${data.action}`
		debounce(tag, () => this.onAction(data), 50)
	}

	onAction(data) {
		console.log('#', this.name, data.action)
		actions.emit(data.action, this)
		this.emit(data.action)
	}

}



export class Light extends ZbDevice {

	willReportState = true

	static matches = whoami => {
		return notExposesAction(whoami)
			&& whoami.definition.exposes.some(e => e.type === 'light' || e.type === 'switch')
	}

	constructor(whoami) {
		super(whoami)
		this.fetchState()
	}

	injectWhoami(whoami) {
		super.injectWhoami(whoami)

		let {type, features} = pickExposedArray(whoami, 'features')

		switch (type) {
			case 'switch':
				this.type = TYPES.SWITCH // smart plug
				break
			case 'light':
				this.type = TYPES.LIGHT
				break
		}

		this.traits = []

		let state = features?.find(f => f.name === 'state')
		if (state && state.type ===  'binary') {
			this.traits.push(TRAITS.OnOff)
			this._stateProps.add('state')
			this._stateOffZb = state.value_off
			this._stateOnZb  = state.value_on
		}

		let brightness = features?.find(f => f.name === 'brightness')
		if (brightness) {
			this.traits.push(TRAITS.Brightness)
			this._stateProps.add('brightness')
			this._brightnessMinZb = brightness.value_min
			this._brightnessMaxZb = brightness.value_max
		}

		let colorTemp = features?.find(f => f.name === 'color_temp')
		if (colorTemp) {
			this.traits.push(TRAITS.TemperatureSetting)
			this._stateProps.add('color_temp')
			this._tempMinZb = colorTemp.value_min
			this._tempMaxZb = colorTemp.value_max
			this.attributes.colorTemperatureRange = {
				temperatureMinK: miredScaleToKelvin(colorTemp.value_min),
				temperatureMaxK: miredScaleToKelvin(colorTemp.value_max)
			}
		}

		let colorXy = features?.find(f => f.name === 'color_xy')
		if (colorXy) {
			this.traits.push(TRAITS.ColorSetting)
			this._stateProps.add('color_xy')
			this.attributes.colorModel = 'rgb'
		}

	}

	_brightnessMinGh = 0
	_brightnessMaxGh = 100

	translateStateToGh(state) {
		return this.translateZbToGh(state)
	}

	// ------------------------- COMMAND EXECUTION / STATE APPLYING -------------------------

	// shared method, accepts ghState
	executeState(ghState) {
		ghState = this.sanitizeGhState(ghState)
		console.gray(this.name, 'execute', ghState)
		let zbState = this.translateGhToZb(ghState)
		this.setQuery(zbState)
	}

	// TODO: rename to executeCommand?
	async executeCommand({command, params}) {
		this.executeState(params)
	}

	// ------------------- COMMUNICATION WITH DEVICE -----------------------

	setQuery(query) {
		super.setQuery(query)
	}

	// ------------------- GHOME-ZIGBEE STATE FORMAT CONVERTION -----------------------

	gh2zb = {
		__entry: ([key, val]) => this.gh2zb[key]?.(val),

		_brightness: val => Math.round((val / 100) * this._brightnessMaxZb),
		_on: val => val ? this._stateOnZb : this._stateOffZb,

		brightness: val => ({brightness: this.gh2zb._brightness(val)}),
		on:         val => ({state: this.gh2zb._on(val)}),
		// WARNING: GH command has uppercase RGB in spectrumRGB. whereas state returned back to GH has capital Rgb spectrumRgb
		color: ({temperatureK, spectrumRGB/*, spectrumHsv*/}) => ({
			...(temperatureK !== undefined ? {color_temp: kelvinToMiredScale(temperatureK)} : {}),
			...(spectrumRGB  !== undefined ? {color_xy:   rgbToXy(spectrumRGB)} : {}),
			//...(spectrumHsv  !== undefined ? {color_hs:   void(spectrumHsv)} : {}), // todo
		}),
	}

	zb2gh = {
		__entry: ([key, val]) => this.zb2gh[key]?.(val),

		_brightness: val => {
			let float = (val / this._brightnessMaxZb) * this._brightnessMaxGh
			let round = Math.round(float)
			return clamp(round, this._brightnessMinGh + 1, this._brightnessMaxGh)
		},
		_state: val => val === this._stateOnZb,

		brightness: val => ({brightness: this.zb2gh._brightness(val)}),
		state:      val => ({on: this.zb2gh._state(val)}),
		color_temp: val => ({color: {temperatureK: miredScaleToKelvin(val)}}),
		//color_xy:   xy => ({color: {spectrumRgb:  xyBriToRgb(xy, brightness)}}), // todo. get brightness in
		//color_hs:   val => ({color: {spectrumHsv:  brightness(val)}}),
	}

	translateGhToZb(ghState) {
		return Object.assign({}, ...Object.entries(ghState).map(this.gh2zb.__entry))
	}

	translateZbToGh(zbState) {
		return Object.assign({}, ...Object.entries(zbState).map(this.zb2gh.__entry))
	}


}

export class Sensor extends ZbDevice {

	static matches = whoami => true

	willReportState = false

	injectWhoami(whoami) {
		super.injectWhoami(whoami)
		/*
		this.traits.push(TRAIT_TEMP)
		this.attributesavailableThermostatModes = ['off']
		this.attributesthermostatTemperatureUnit = 'C'
		this.attributesqueryOnlyTemperatureSetting = true
		//this.state.thermostatTemperatureAmbient

		this.traits.push(TRAIT_HUMIDITY)
		this.queryOnlyHumiditySetting = true
		//this.state.humidityAmbientPercent

		// door/window
		this.traits.push(TRAIT_OPENCLOSE)
		*/
	}

}



// color_temp
const msMin = 153
const msMax = 555
const megaKelvin = 1000000

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

const kelvinToMiredScale = kelvin => clamp(Math.round((1 / kelvin) * megaKelvin), msMin, msMax)
const miredScaleToKelvin = ms     => Math.round((1 / clamp(ms, msMin, msMax)) * megaKelvin)