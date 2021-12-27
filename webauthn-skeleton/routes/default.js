const database = require('../db/db')
const token = require('../utils/token')
const koaRouter = require('@koa/router')

const router = koaRouter()

function success(ctx, data) {
	ctx.status = 200
	return ctx.body = { data }
}

function fail(ctx, data) {
	ctx.status = 500
	return ctx.body = { data }
}

/* Returns if user is logged in */
router.get('/isLoggedIn', (ctx) => {
	return success(ctx, ctx.session.loggedIn)
})

/* Logs user out */
router.get('/logout', (ctx) => {
	ctx.session.loggedIn = false
	ctx.session.username = undefined
	return success(ctx)
})

/* Returns personal info and THE SECRET INFORMATION */
router.get('/personalInfo', (ctx) => {
	if (!ctx.session.loggedIn) {
		return fail(ctx, 'Access denied')
	} else {
		return success(ctx, {
			data: 'this is secret'
		})
	}
})

module.exports = router