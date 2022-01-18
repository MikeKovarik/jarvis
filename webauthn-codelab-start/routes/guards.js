export const csrfGuard = (req, res, next) => {
	if (req.header('X-Requested-With') !== 'XMLHttpRequest') {
		res.status(400).json({error: 'invalid access.'})
		return
	}
	next()
}

/**
 * Checks CSRF protection using custom header `X-Requested-With`
 * If the session doesn't contain `signed-in`, consider the user is not authenticated.
 **/
export const signedInGuard = (req, res, next) => {
	if (!req.session.loggedIn) {
		res.status(401).json({error: 'not signed in.'})
		return
	}
	next()
}
