let canNotifyHub = false;
let hubHost = '';
let hubPort = 0;

RPC.addHandler('linkToHub', function(data) {
	console.log('linkToHub', JSON.stringify(data));
	canNotifyHub = true;
	hubHost = data.host;
	hubPort = data.port;
	console.log('hubHost', hubHost);
	console.log('hubPort', hubPort);
	notifyHub();
	return {}
});

RPC.addHandler('whoami', function() {
	return whoami;
});

RPC.addHandler('state', function() {
	return state;
});

// TODO: consider moving away from TCP-to-hub and to mutlticas UDP broadcasting.
function notifyHub() {
	if (canNotifyHub) {
		console.log('Trying to notify hub');
		Net.connect({
			addr: 'tcp://' + hubHost + ':' + JSON.stringify(hubPort),
			onconnect: function(conn) {
				Net.send(conn, createPostData());
				Net.close(conn);
				console.log('Notified hub of state uptate');
			}
		});
	} else {
		console.log('Cannot notify hub. Hub ip/hostname is not known');
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
}

// ------------ UDP BROADCAST ADVERTISEMENT -------------------------


let broadcastIp = '230.185.192.108';
let broadcastPort = 1609;
let broadcastAddr = 'udp://' + broadcastIp + ':' + JSON.stringify(broadcastPort);

let gotIp = false;
let gotTime = false;

function startBroadcasting() {
	broadcastHeartbeat();
	setInterval(broadcastHeartbeat, heartbeatInterval);
}

function broadcastHeartbeat() {
	console.log('sending heartbeat');
	Net.connect({
		addr: broadcastAddr,
		onconnect: function(conn) {
			//console.log('heartbeat socket connected');
			let uptime = Sys.uptime();
			let data = {
				id: whoami.id,
				bootTime: floor(Timer.now() - uptime) * 1000,
				upTime: floor(uptime) * 1000,
				heartbeatInterval: heartbeatInterval,
			};
			Net.send(conn, JSON.stringify(data));
			Net.close(conn);
		},
		//onclose: function(conn) {
		//	console.log('heartbeat socket closed');
		//},
		//onerror: function(conn) {
		//	console.log('heartbeat socket error');
		//},
	});
}

Event.addHandler(Net.STATUS_GOT_IP, function(ev, evdata, ud) {
	gotIp = true;
	if (gotIp && gotTime) {
		startBroadcasting();
	}
}, null);

Event.addHandler(MGOS_EVENT_TIME_CHANGED, function (ev, evdata, ud) {
	gotTime = true;
	if (gotIp && gotTime) {
		startBroadcasting();
	}
}, null);