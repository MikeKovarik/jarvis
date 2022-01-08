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
	ctx.session.username = undefined
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
		/*
		let tokenInfo = undefined,
			userInfo = database.users[ctx.session.username]
		if (userInfo.oneTimeToken) {            
			if (userInfo.oneTimeToken.expires > new Date().getTime()) {
				tokenInfo = { 
					token: token.encode(userInfo.oneTimeToken.token),
					expires: userInfo.oneTimeToken.expires 
				}
			} else {
				tokenInfo = undefined
				userInfo.oneTimeToken = undefined
			}
		}
		return ctx.body = {
			'status': 'ok',
			'authenticators': userInfo.authenticators,
			'name': userInfo.name,
			'oneTimeToken': tokenInfo,
			'recoveryEmail': userInfo.recoveryEmail
		}
		*/
	}
})

router.get('/db', async (ctx) => {
	return ctx.body = JSON.stringify(database, null, 2)
})

export default router