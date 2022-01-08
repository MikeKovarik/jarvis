export const fail = (ctx, message) => ctx.body = {
	status: 'failed',
	message
}

export const success = (ctx, message) => ctx.body = {
	status: 'ok',
	message
}