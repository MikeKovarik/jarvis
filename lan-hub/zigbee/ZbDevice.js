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

	static matches = notExposesAction

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
			this._brightnessMaxZb = brightness.value_max
			this._brightnessMinZb = brightness.value_min
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
		color: ({temperatureK, spectrumRgb, spectrumHsv}) => ({
			...(temperatureK !== undefined ? {color_temp: kelvinToMiredScale(temperatureK)} : {}),
			...(spectrumRgb  !== undefined ? {color_xy:   void(temperatureK)} : {}), // todo
			...(spectrumHsv  !== undefined ? {color_hs:   void(temperatureK)} : {}), // todo
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
		_color_temp: miredScaleToKelvin,
		_color_xy: val => undefined, // todo
		_color_hs: val => undefined, // todo https://www.zigbee2mqtt.io/zbDevices/RB_285_C.html

		brightness: val => ({brightness: this.zb2gh._brightness(val)}),
		state:      val => ({on: this.zb2gh._state(val)}),
		color_temp: val => ({color: {temperatureK: this.zb2gh._color_temp(val)}}),
		color_xy:   val => ({color: {spectrumRgb:  this.zb2gh._color_xy(val)}}),
		color_hs:   val => ({color: {spectrumHsv:  this.zb2gh._color_hs(val)}}),
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

const kelvinToMiredScale = kelvin => clamp(Math.round((1 / kelvin) * megaKelvin), msMin, msMax)
const miredScaleToKelvin = ms     => Math.round((1 / clamp(ms, msMin, msMax)) * megaKelvin)