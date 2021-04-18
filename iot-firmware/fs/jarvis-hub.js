let broadcastIp = '230.185.192.108';
let broadcastPort = 1609;
let broadcastAddr = 'udp://' + broadcastIp + ':' + JSON.stringify(broadcastPort);

let gotIp = false;
let gotTime = false;

RPC.addHandler('whoami', function() {
	return whoami;
});

RPC.addHandler('state', function() {
	return state;
});

// TODO: consider moving away from TCP-to-hub and to mutlticas UDP broadcasting.
function broadcastStatus() {
	console.log('broadcasting status');
	Net.connect({
		addr: broadcastAddr,
		onconnect: function(conn) {
			let data = {
				id: whoami.id,
				state: state
			};
			Net.send(conn, JSON.stringify(data));
			Net.close(conn);
		}
	});
}

let heartbeatIntervalId = undefined;

function startBroadcastingHeartbeat() {
	broadcastHeartbeat();
	if (heartbeatIntervalId !== undefined) clearInterval(heartbeatIntervalId);
	heartbeatIntervalId = setInterval(broadcastHeartbeat, heartbeatInterval);
}

function broadcastHeartbeat() {
	console.log('broadcasting heartbeat');
	Net.connect({
		addr: broadcastAddr,
		onconnect: function(conn) {
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
	});
}

Event.addHandler(Net.STATUS_GOT_IP, function(ev, evdata, ud) {
	gotIp = true;
	if (gotIp && gotTime) {
		startBroadcastingHeartbeat();
	}
}, null);

Event.addHandler(MGOS_EVENT_TIME_CHANGED, function (ev, evdata, ud) {
	gotTime = true;
	if (gotIp && gotTime) {
		startBroadcastingHeartbeat();
	}
}, null);