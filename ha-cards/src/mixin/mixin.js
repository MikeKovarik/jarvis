import {LitElement} from 'lit'


const allDependencies = new Map

const getMixinDependencies = mixin => {
	if (allDependencies.has(mixin)) {
		return allDependencies.get(mixin)
	} else {
		const dependencies = mixin(class {}).dependencies ?? []
		allDependencies.set(mixin, dependencies)
		return dependencies
	}
}

export const mixin = (...args) => {
	const Main = args.find(arg => !!arg.prototype) ?? class {}
	const mixins = args.filter(arg => arg != Main)
	const dependencies = mixins.map(getMixinDependencies).flat()
	for (let dependency of dependencies)
		if (!mixins.includes(dependency))
			mixins.unshift(dependency)
	return mixins.reduce((Prev, m) => m(Prev), Main)
}

export const slickElement = (...args) => {
	return mixin(LitElement, ...args)
}

export * from './eventEmitter.js'
export * from './hass.js'
export * from './onOff.js'
export * from './holdGesture.js'
export * from './resizeObserver.js'