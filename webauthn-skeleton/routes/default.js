import koaRouter from '@koa/router'
import database from '../db/db.js'
import {fail, success} from './util.js'


const router = koaRouter()

/* Returns if user is logged in */
router.get('/isLoggedIn', (ctx) => {
	if (!ctx.session.loggedIn)
		return fail(ctx)
	else
		return success(ctx)
})

/* Logs user out */
router.get('/logout', (ctx) => {
	ctx.session.loggedIn = false
	return success(ctx)
})

/* Returns personal info and THE SECRET INFORMATION */
router.get('/personalInfo', (ctx) => {
	if (!ctx.session.loggedIn) {
		return fail(ctx, 'Access denied')
	} else {
		return ctx.body = {
			'status': 'ok',
			'authenticators': database,
			'name': 'foo',
		}
	}
})

router.get('/db', async (ctx) => {
	return ctx.body = JSON.stringify(database, null, 2)
})

export default router