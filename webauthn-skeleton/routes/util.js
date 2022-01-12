export const fail = (ctx, message) => ctx.body = {
	status: 'failed',
	message
}

export const success = (ctx, message) => ctx.body = {
	status: 'ok',
	message
}

export const loggedInGuard = (ctx, next) => {
	if (!ctx.session.loggedIn)
		ctx.throw(401, 'Unauthorized')
	else
		next()
}
