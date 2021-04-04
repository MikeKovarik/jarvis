let canNotifyHub = false;
let hubHost = '';
let hubPort = 0;

RPC.addHandler('linkToHub', function(data) {
	print('linkToHub', JSON.stringify(data));
	canNotifyHub = true;
	hubHost = data.host;
	hubPort = data.port;
	print('hubHost', hubHost);
	print('hubPort', hubPort);
	notifyHub();
	return {}
});

RPC.addHandler('whoami', function() {
	return whoami;
});

RPC.addHandler('state', function() {
	return state;
});

function notifyHub() {
	if (canNotifyHub) {
		print('Trying to notify hub');
		Net.connect({
			addr: 'tcp://' + hubHost + ':' + JSON.stringify(hubPort),
			onconnect: function(conn) {
				Net.send(conn, createPostData());
				Net.close(conn);
				print('Notified hub of state uptate');
			}
		});
	} else {
		print('Cannot notify hub. Hub ip/hostname is not known');
	}
}

function createPostData() {
	let json = JSON.stringify(state);
	return 'POST /device-state-update HTTP/1.1'
		+ '\n' + 'Host: ' + hubHost 
		+ '\n' + 'content-type: application/json'
		+ '\n' + 'content-length: ' + JSON.stringify(json.length)
		+ '\n'
		+ '\n' + json;
	return JSON.stringify(state);
}