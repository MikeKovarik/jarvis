import koaRouter from '@koa/router'
import database from '../db/db.js'
import {success, loggedInGuard} from './util.js'


const router = koaRouter()

router.get('/loggedin', ctx => {
	let loggedIn = ctx.session.loggedIn ?? false
	return ctx.body = {loggedIn}
})

router.get('/logout', ctx => {
	ctx.session.loggedIn = false
	return success(ctx)
})

router.get('/credentials', loggedInGuard, ctx => {
	return ctx.body = {
		'status': 'ok',
		'authenticators': database,
		'name': 'foo',
	}
})

router.get('/db', async ctx => {
	return ctx.body = JSON.stringify(database, null, 2)
})

export default router