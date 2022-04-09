import {LitElement} from 'lit'


export const mixin = (...args) => {
	const Main = args.find(arg => !!arg.prototype) ?? class {}
	const mixins = args.filter(arg => arg != Main)
	return mixins.reduce((Prev, m) => m(Prev), Main)
}

export const slickElement = (...args) => {
	return mixin(LitElement, ...args)
}

export * from './eventEmitter.js'
export * from './hass.js'
export * from './onOff.js'
export * from './holdGesture.js'