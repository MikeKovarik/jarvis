export const csrfGuard = (req, res, next) => {
	if (req.header('X-Requested-With') === 'XMLHttpRequest')
		next()
	else
		res.status(400).json({message: 'invalid access'})
}

/**
 * Checks CSRF protection using custom header `X-Requested-With`
 * If the session doesn't contain `signed-in`, consider the user is not authenticated.
 **/
export const loggedInGuard = (req, res, next) => {
	if (req.session.loggedIn)
		next()
	else
		res.status(401).json({message: 'not signed in'})
}
