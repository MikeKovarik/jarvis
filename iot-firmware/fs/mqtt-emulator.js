let pollPort = 1609;
let cmdPort = 1610;

let broadcastIp = '224.0.0.69';
let broadcastPort = 1609;
let broadcastAddr = 'udp://' + broadcastIp + ':' + JSON.stringify(broadcastPort);

let helloToken = 'JARVIS';
let delimeter = '␊';

let topics = {};
let handlers = {};
let stateHandlers = [];

let EV_CONNACK = 1;
let EV_CLOSE = 2;

let tcpConn = undefined;

// ------------ EVENT HANDLERS -------------------------

Event.addHandler(Net.STATUS_CONNECTED, function(ev, evdata, ud) {
	console.log('MQTT-E: net connected')
	createTcpPollServer();
	createTcpCmdServer();
	broadcastUdpAnnounce();
}, null);

function createTcpPollServer() {
	Net.serve({
		addr: 'tcp://' + JSON.stringify(pollPort),
		onconnect: function(conn) {
			console.log('MQTT-E: poll-hub onconnect');
			tcpConn = conn;
			sendToHub(helloToken);
			callAllEventHandlers(conn, EV_CONNACK);
			sendJsonToHub(getMqttInfo());
		},
		onclose: function(conn) {
			console.log('MQTT-E: poll-hub onclose');
			tcpConn = undefined;
			callAllEventHandlers(conn, EV_CLOSE);
		},
	});
}

function createTcpCmdServer() {
	Net.serve({
		addr: 'tcp://' + JSON.stringify(cmdPort),
		ondata: function(conn, json) {
			handleDataFromHub(json);
		},
	});
}

function broadcastUdpAnnounce() {
	Net.connect({
		addr: broadcastAddr,
		onconnect: function(conn) {
    		console.log('MQTT-E: announce connected');
			Net.send(conn, 'yo!');
    		console.log('MQTT-E: announce done');
		},
		ondata: function(conn, data) {
    		console.log('MQTT-E: announce ondata', data);
			Net.discard(conn, data.length);  // Discard received data
		}
	});
}

// ------------ INTERNALS -------------------------

function getMqttInfo() {
	return {
		topics:      topics,
		willTopic:   Cfg.get('mqtt.will_topic'),
		willMessage: Cfg.get('mqtt.will_message'),
	}
}

function sendJsonToHub(data) {
	sendToHub(JSON.stringify(data));
}

function sendToHub(data) {
	if (isConnected()) {
		Net.send(tcpConn, data);
		Net.send(tcpConn, delimeter);
	}
}

function handleDataFromHub(json) {
	let data = JSON.parse(json);
	console.log('CMD:', JSON.stringify(data))
	if (data.topic && handlers[data.topic]) {
		console.log('executing', data.topic, ':', data.message);
		handlers[data.topic](data.message);
	}
}

function callAllEventHandlers(conn, ev) {
	for (let i = 0; i < stateHandlers.length; i++) {
		stateHandlers[i](conn, ev);
	}
}

// ------------ MONGOOSE MQTT API EMULATOR -------------------------

function isConnected() {
	return tcpConn !== undefined;
}

function sub(topic, handler) {
	topics[topic] = true;
	handlers[topic] = handler;
	sendJsonToHub({
		topics: topics
	});
}

function pub(topic, message) {
	sendJsonToHub({
		topic: topic,
		message: message
	});
}

function setEventHandler(handler) {
	stateHandlers.push(handler);
	//handler(conn, ev, edata);
}


let MQTT = {
	EV_CONNACK: EV_CONNACK,
	EV_CLOSE: EV_CLOSE,
	isConnected: isConnected,
	sub: sub,
	pub: pub,
	setEventHandler: setEventHandler,
}
