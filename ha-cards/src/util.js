export const mixin = (...args) => {
	const Main = args.find(arg => !!arg.prototype) ?? class {}
	const mixins = args.filter(arg => arg != Main)
	return mixins.reduce((Prev, m) => m(Prev), Main)
}