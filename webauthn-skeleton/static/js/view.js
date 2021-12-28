import {register, login} from './webauthn.auth.js'

const renderMainContainer = (response) => {
    
	// Update name
	$('#name').text(response.name);
    
	// Clear credential table
	$('#credential-table tbody').html('');

	for(let authenticator of response.authenticators) {        
		$('#credential-table tbody').append('<tr><td><pre class\'pubkey\'>' + authenticator.counter + '</pre></td><td><pre class=\'pubkey\'>' + authenticator.publicKey + '</pre></td><td><pre class=\'pubkey\'>' + new Date(authenticator.created).toLocaleString() + '</pre></td></tr>');
	}

	$('#login-token').hide();
	$('#registerContainer').hide();
	$('#mainContainer').show();
};

export const loadMainContainer = () => {
	return fetch('/personalInfo', {credentials: 'include'})
		.then((response) => response.json())
		.then((response) => {
			if(response.status === 'ok') {
				renderMainContainer(response);
			} else {
				alert(`Error! ${response.message}`);
			}
		});
};

export const checkIfLoggedIn = () => {
	return fetch('/isLoggedIn', {credentials: 'include'})
		.then((response) => response.json())
		.then((response) => {
			if(response.status === 'ok') {
				return true;
			} else {
				return false;
			}
		});
};

$('#button-logout').click(() => {
	fetch('/logout', {credentials: 'include'});

	$('#registerContainer').show();
	$('#mainContainer').hide();
});


$('#button-add-credential').click(() => {
	register(undefined, true);
});

$('#button-register').click(() => {
	const name = $('#name')[0].value;
	if(!name) {
		alert('Username is missing!');
	} else {
		register(name);
	}
});

$('#button-login').click(() => {   
	login();
});
