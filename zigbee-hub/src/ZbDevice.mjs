import equal from 'fast-deep-equal'
import devices from './devices.mjs'
import actions from './actions.mjs'
import topics, {bridgeRootTopic, renameResponse, mqttClient} from './topics.mjs'
import {GhomeDevice} from '../../lan-hub/DeviceCore.js'
import {TYPES, TRAITS} from './ghome.mjs'
import {clamp} from './util.mjs'


const debounceTimeouts = {}

const debounce = (tag, handler, millis = 100) => {
	clearTimeout(debounceTimeouts[tag])
	debounceTimeouts[tag] = setTimeout(handler, millis)
}

const exposesAction = device => device.definition?.exposes?.some(ex => ex.name === 'action') ?? false
const notExposesAction = device => !exposesAction(device)

const pickExposedArray = (device, name) => device.definition?.exposes.find(ex => ex[name]) || {}
const pickExposedEnum = (device, name) => device.definition?.exposes.find(ex => ex.name === name)?.values ?? []

export class ZbDevice extends GhomeDevice {

	static isButton = exposesAction
	static isLight = notExposesAction
	static getCtor(zbDevice) {
		if (this.isButton(zbDevice))
			return Button
		else if (this.isLight(zbDevice))
			return Light
	}

	static from(zbDevice) {
		let {ieee_address} = zbDevice
		if (devices.has(ieee_address)) {
			let ghDevice = devices.get(ieee_address)
			ghDevice.injectZbData(zbDevice)
			return ghDevice
		} else {
			let Ctor = this.getCtor(zbDevice)
			return new Ctor(zbDevice)
		}
	}

	constructor(zbDevice) {
		super()

		//console.log('---------------------------------------')
		//console.log(JSON.stringify(zbDevice, null, 2))

		//this.on('state-change', () => console.log(this.name, this.state))

		this.deviceInfo = {
			manufacturer: zbDevice.manufacturer,
			model:        zbDevice.model_id,
			hwVersion:    '1.0.0',
			swVersion:    zbDevice.software_build_id
		}

		this.onData = this.onData.bind(this)

		this.id = zbDevice.ieee_address
		this.injectZbData(zbDevice)
		topics.on(renameResponse, this.onGlobalRename)
		devices.set(this.id, this)
		this.init?.(zbDevice)
	}

	injectZbData(zbDevice) {
		//this.name = zbDevice.friendly_name
		if (this.name !== zbDevice.friendly_name)
			this.onRename(zbDevice.friendly_name)
	}

	onGlobalRename = ({data: {from, to}}) => {
		if (this.name === from) this.onRename(to)
	}

	onRename = friendlyName => {
    	//console.log('~ onRename', friendlyName)
		this.unsubscribe()
		this.name = friendlyName
		this.subscribe()
	}

	_subscribed = false

	unsubscribe() {
		if (!this._subscribed) return
		topics.off(this.baseTopic, this.onData)
		topics.off(this.availabilityTopic, this.onAvailability)
		this._subscribed = false
	}

	subscribe() {
		if (this._subscribed) return
		topics.on(this.baseTopic, this.onData)
		topics.on(this.availabilityTopic, this.onAvailability)
		this._subscribed = true
	}

	get friendlyName() {
		return this.name
	}

	get baseTopic() {
		return `${bridgeRootTopic}/${this.friendlyName}`
	}

	get availabilityTopic() {
		return `${this.baseTopic}/availability`
	}

	get getTopic() {
		return `${this.baseTopic}/get`
	}

	get setTopic() {
		return `${this.baseTopic}/set`
	}

	onData(val) {
		let {linkquality, update, action, ...data} = val
		let newState = {...this.zbState, ...data}
		if (equal(this.zbState, newState)) return
		this.onState(newState)
	}

	onState(newState) {
		this.zbState = newState
		this.emit('state-change', this.state)
	}

	online = false

	onAvailability = val => {
		let newVal = val === 'online'
		if (this.online !== newVal) {
			this.online = newVal
			this.emit('online', this.online)
			this.emit('state-change', this.state)
		}
	}

	toString() {
		const {id, name, type, traits} = this
		return {id, name, type, traits}
	}

	// ------------------- COMMUNICATION WITH DEVICE -----------------------

	getQuery(query) {
        //console.log('~ getQuery', query)
		mqttClient.publish(this.getTopic, JSON.stringify(query))
	}

	setQuery(query) {
        //console.log('~ setQuery', query)
		mqttClient.publish(this.setTopic, JSON.stringify(query))
	}

}



export class Button extends ZbDevice {

	willReportState = false
/*
	init(zbDevice) {
		console.log('--------')
		console.log('ieee_address ', zbDevice.ieee_address)
		console.log('friendly_name', zbDevice.friendly_name)
		console.log('exposedActions', pickExposedEnum(zbDevice, 'action'))
	}
*/

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

	constructor(zbDevice) {
		super(zbDevice)
		this.onData = this.onData.bind(this)
	}

	init(zbDevice) {
		this.fetchState()
	}

	injectZbData(zbDevice) {
		super.injectZbData(zbDevice)

/*
		console.log('----------------------------------')
		console.log('description  ', zbDevice.definition.description)
		console.log('friendly_name', zbDevice.friendly_name)
		console.log('ieee_address ', zbDevice.ieee_address)
		console.log('model_id     ', zbDevice.model_id)
        console.log('type', type)
        console.log('features', features)
*/
		let {type, features} = pickExposedArray(zbDevice, 'features')

		switch (type) {
			case 'switch':
				this.type = TYPES.SWITCH
				break
			case 'light':
				this.type = TYPES.LIGHT
				break
		}

		this.traits = []

		let state = features.find(f => f.name === 'state')
		if (state && state.type ===  'binary') {
			this.traits.push(TRAITS.OnOff)
			this._stateOffZb = state.value_off
			this._stateOnZb  = state.value_on
		}

		let brightness = features.find(f => f.name === 'brightness')
		if (brightness) {
			this.traits.push(TRAITS.Brightness)
			this._brightnessMaxZb = brightness.value_max
			this._brightnessMinZb = brightness.value_min
		}

	}

	_brightnessMinGh = 0
	_brightnessMaxGh = 100

	fetchState() {
		let query = {}
		if (this.traits.includes(TRAITS.OnOff))
			query.state = ''
		if (this.traits.includes(TRAITS.Brightness))
			query.brightness = ''
		this.getQuery(query)
	}

	get state() {
		return this.translateZbToGh(this.zbState || {})
	}

	// ------------------------- COMMAND EXECUTION / STATE APPLYING -------------------------

	// shared method, accepts ghState
	applyState(ghState) {
		ghState = this.sanitizeGhState(ghState)
		let zbState = this.translateGhToZb(ghState)
		this.setQuery(zbState)
	}

	// TODO: rename to executeCommand?
	async execute({command, params}) {
		console.gray(this.id, 'execute()', command, params)
		this.applyState(params)
	}

	// ------------------- COMMUNICATION WITH DEVICE -----------------------

	setQuery(query) {
		query.transition = 1
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
		_color_hs: val => undefined, // todo https://www.zigbee2mqtt.io/devices/RB_285_C.html

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
		return Object.assign({online: this.online}, ...Object.entries(zbState).map(this.zb2gh.__entry))
	}


}

export class Sensor extends ZbDevice {

	injectZbData(zbDevice) {
		super.injectZbData(zbDevice)
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