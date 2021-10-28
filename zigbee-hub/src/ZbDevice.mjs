import equal from 'fast-deep-equal'
import devices from './devices.mjs'
import actions from './actions.mjs'
import topics, {bridgeRootTopic, renameResponse, mqttClient} from './topics.mjs'
import {GhomeDevice} from '../../lan-hub/DeviceCore.js'


const debounceTimeouts = {}

const debounce = (tag, handler, millis = 100) => {
	clearTimeout(debounceTimeouts[tag])
	debounceTimeouts[tag] = setTimeout(handler, millis)
}

const exposesAction = device => device.definition?.exposes?.some(ex => ex.name === 'action') ?? false
const notExposesAction = device => !exposesAction(device)

const pickExposedArray = (device, name) => device.definition?.exposes.find(ex => ex[name])
const pickExposedEnum = (device, name) => device.definition?.exposes.find(ex => ex.name === name)?.values ?? []

const TRAIT_ONONFF     = 'action.devices.traits.OnOff'
const TRAIT_BRIGHTNESS = 'action.devices.traits.Brightness'

const TYPE_SWITCH = 'action.devices.types.SWITCH'
const TYPE_LIGHT = 'action.devices.types.LIGHT'

export class ZbDevice extends GhomeDevice {

	reportState() {
		console.log('*', this.name, this.state, this.ghomeState)
	}

	traits = []

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

	subscribed = false

	unsubscribe() {
		if (!this.subscribed) return
		topics.off(this.baseTopic, this.onData)
		topics.off(this.availabilityTopic, this.onAvailability)
		this.subscribed = false
	}

	subscribe() {
		if (this.subscribed) return
		topics.on(this.baseTopic, this.onData)
		topics.on(this.availabilityTopic, this.onAvailability)
		this.subscribed = true
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
		let newState = {...this.state, ...data}
		if (equal(this.state, newState)) return
		this.onState(newState)
	}

	onState(newState) {
		this.state = newState
		this.emit('state-change', this.state)
	}

	online = false

	onAvailability = val => {
		//console.log('onAvailability', this.name, val)
		let newVal = val === 'true'
		if (this.online !== newVal) {
			this.online = newVal
			this.emit('online', this.online)
		}
	}

	toString() {
		const {id, name, type, traits} = this
		return {id, name, type, traits}
	}

}



export class Button extends ZbDevice {

	willReportState = false
/*
	constructor(zbDevice) {
		super(zbDevice)
		this.onData = this.onData.bind(this)
	}
*/
	init(zbDevice) {
/*
		console.log('--------')
		console.log('ieee_address ', zbDevice.ieee_address)
		console.log('friendly_name', zbDevice.friendly_name)
		console.log('exposedActions', pickExposedEnum(zbDevice, 'action'))
*/
		// ignored exposed: linkquality, action
	}

	onData(data) {
		super.onData(data)
		if (data.action === undefined) return
		// ignore battery and other non-action status updates
		let tag = `${this.name}|${data.action}`
		debounce(tag, () => this.onAction(data), 50)
	}

	injectZbData(zbDevice) {
		super.injectZbData(zbDevice)
		const actions = pickExposedEnum(zbDevice, 'action')
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

		let {type, features} = pickExposedArray(zbDevice, 'features')
/*
		console.log('----------------------------------')
		console.log('description  ', zbDevice.definition.description)
		console.log('friendly_name', zbDevice.friendly_name)
		console.log('ieee_address ', zbDevice.ieee_address)
		console.log('model_id     ', zbDevice.model_id)
        console.log('type', type)
        console.log('features', features)
*/
		switch (type) {
			case 'switch':
				this.type = TYPE_SWITCH
				break
			case 'light':
				this.type = TYPE_LIGHT
				break
		}

		this.traits = []

		let state = features.find(f => f.name === 'state')
		if (state && state.type ===  'binary') {
			this.traits.push(TRAIT_ONONFF)
			this._value_off = state.value_off
			this._value_on  = state.value_on
		}

		let brightness = features.find(f => f.name === 'brightness')
		if (brightness) {
			this.traits.push(TRAIT_BRIGHTNESS)
			this._value_max = brightness.value_max
			this._value_min = brightness.value_min
		}

	}

	fetchState() {
		let query = {}
		if (this.traits.includes(TRAIT_ONONFF))
			query.state = ''
		if (this.traits.includes(TRAIT_BRIGHTNESS))
			query.brightness = ''
		this.getQuery(query)
	}

	getQuery(query) {
        //console.log('~ getQuery', query)
		mqttClient.publish(this.getTopic, JSON.stringify(query))
	}

	setQuery(query) {
        //console.log('~ setQuery', query)
		mqttClient.publish(this.setTopic, JSON.stringify(query))
	}

	get ghomeState() {
		let out = {online: this.online}
		if (this.traits.includes(TRAIT_ONONFF)) {
			out.state = this.stateToGh(this.state.state)
		}
		if (this.traits.includes(TRAIT_BRIGHTNESS)) {
			out.brightness = this.brightnessToGh(this.state.brightness)
		}
		return out
	}

	stateToGh(val = this.state.state) {
		return val === this._value_on
	}

	stateToZb(val) {
		return val ? this._value_on : this._value_off
	}

	brightnessToGh(val = this.state.brightness) {
		return roundTo((val / this._value_max) * 100)
	}

	brightnessToZb(val) {
		return Math.round((val / 100) * this._value_max)
	}

	sanitizeParams(arg) {
		let params = {}
		let type = typeof arg
		if (type === 'number')
			params.brightness = arg
		else if (type === 'boolean')
			params.on = arg
		else if (type === 'object')
			params.on = arg
		else
			throw new Error(`Incorrect params`, arg)
        console.log('params', params)
		return params
	}

	translateParamsToQuery(params) {
		let {brightness, on} = this.sanitizeParams(params)
		let query = {}
		if (brightness === 0 || on === false) {
			query.state = this.stateToZb(false)
		} else if (on === true) {
			query.state = this.stateToZb(true)
		} else if (brightness !== undefined) {
			query.state = this.stateToZb(true)
			query.brightness = this.brightnessToZb(brightness)
		}
        console.log('query', query)
		return query
	}

	applyState(options) {
		let query = this.translateParamsToQuery(options)
		this.setQuery(query)
	}

	// TODO: rename to executeCommand?
	async execute({command, params}) {
		console.gray(this.id, 'execute()', command, params)
		//if (state) this.injectState(state)
		//return this.state
	}

}

//const ACTION_ONOFF              = 'action.devices.commands.OnOff'
//const ACTION_BRIGHTNESSABSOLUTE = 'action.devices.commands.BrightnessAbsolute'
//const ACTION_COLORABSOLUTE      = 'action.devices.commands.ColorAbsolute'


export class Sensor extends ZbDevice {
}


const roundTo = num => Number(num.toFixed(2))