/* global $, QrCreator, register, login */
/* exported loadMainContainer, checkIfLoggedIn */

const renderMainContainer = (response) => {
    
	// Update name
	$('#name').text(response.name)
    
	// Clear credential table
	$('#credential-table tbody').html('')

	for(let authenticator of response.authenticators) {        
		$('#credential-table tbody').append('<tr><td><pre class\'pubkey\'>' + authenticator.counter + '</pre></td><td><pre class=\'pubkey\'>' + authenticator.publicKey + '</pre></td><td><pre class=\'pubkey\'>' + new Date(authenticator.created).toLocaleString() + '</pre></td></tr>')
	}

	$('#registerContainer').hide()
	$('#mainContainer').show()
}

const loadMainContainer = () => {
	return fetch('/personalInfo', {credentials: 'include'})
		.then((response) => response.json())
		.then((response) => {
			console.log('response', response)
		})
}

let checkIfLoggedIn = () => {
	return fetch('/isLoggedIn', {credentials: 'include'})
		.then((response) => response.text())
		.then((response) => response === true)
}

$('#button-logout').click(() => {
	fetch('/logout', {credentials: 'include'})

	$('#registerContainer').show()
	$('#mainContainer').hide()
})

$('#button-register').click(() => register('username'))

$('#button-login').click(() => login('username'))