load('config.js');


const IR_PIN = 14;

const IR_CODES = {
	POWER: 0,
	RETURN: 0,
	ENTER: 0,
	PAUSE: 0,
	STOP: 0,
	PREV: 0,
	NEXT: 0,
	VOL_UP: 0,
	VOL_DOWN: 0,
	VOL_MUTE: 0,
	CH_UP: 0,
	CH_DOWN: 0,
	ARROW_TOP: 0,
	ARROW_RIGHT: 0,
	ARROW_BOTTOM: 0,
	ARROW_LEFT: 0,
}

GPIO.set_mode(pins.out1, GPIO.MODE_OUTPUT);

// Turn the device on.
// "params": {"on": true}
RPC.addHandler('action.devices.commands.OnOff', function(data) {
	// state.on is controlled by sensor
	IR.Sender.NEC.pwm(IR_PIN, IR_CODES.POWER);
});


//
//
RPC.addHandler('action.devices.commands.BrightnessAbsolute', function(data) {
});

// Brighten my light by 20%.
// "params": {"brightnessRelativePercent": 20}
// Dim my light a little.
// "params": {"brightnessRelativeWeight": -1}
RPC.addHandler('action.devices.commands.BrightnessRelative', function(data) {
});


// Set relative volume of speaker device in command-only mode
// "params": {"relativeSteps": -1}
RPC.addHandler('action.devices.commands.volumeRelative', function(data) {
	if (true) {
		IR.Sender.NEC.pwm(IR_PIN, IR_CODES.VOL_UP);
	} else {
		IR.Sender.NEC.pwm(IR_PIN, IR_CODES.VOL_DOWN);
	}
});

// Mute speaker device
// "params": {"mute": true}
RPC.addHandler('action.devices.commands.mute', function(data) {
	IR.Sender.NEC.pwm(IR_PIN, IR_CODES.VOL_MUTE);
});


// Select YouTube app by key
// "params": {"newApplication": "youtube"}
RPC.addHandler('action.devices.commands.appSelect', function(data) {
});


// Select USB input
// "params": {"newInput": "usb_1"}
RPC.addHandler('action.devices.commands.SetInput', function(data) {
});


// Change to KTVU
// "params": {"channelCode": "ktvu2", "channelName": "KTVU"}
// Turn to channel three.
// "params": {"channelNumber": "3"}
RPC.addHandler('action.devices.commands.selectChannel', function(data) {
});

// Switch to the next channel
// "params": {"relativeChannelChange": 1}
// Switch to the previous channel
// "params": {"relativeChannelChange": -1}
RPC.addHandler('action.devices.commands.relativeChannel', function(data) {
	if (true) {
		IR.Sender.NEC.pwm(IR_PIN, IR_CODES.CH_UP);
	} else {
		IR.Sender.NEC.pwm(IR_PIN, IR_CODES.CH_DOWN);
	}
});

// Return to the last channel
// "params": {}
RPC.addHandler('action.devices.commands.returnChannel', function(data) {
	IR.Sender.NEC.pwm(IR_PIN, IR_CODES.RETURN);
});

// "params": {}
RPC.addHandler('action.devices.commands.mediaNext', function(data) {
	IR.Sender.NEC.pwm(IR_PIN, IR_CODES.NEXT);
});

// "params": {}
RPC.addHandler('action.devices.commands.mediaPrevious', function(data) {
	IR.Sender.NEC.pwm(IR_PIN, IR_CODES.PREV);
});

// "params": {}
RPC.addHandler('action.devices.commands.mediaPause', function(data) {
	IR.Sender.NEC.pwm(IR_PIN, IR_CODES.PAUSE);
});

// "params": {}
RPC.addHandler('action.devices.commands.mediaResume', function(data) {
	IR.Sender.NEC.pwm(IR_PIN, IR_CODES.PAUSE);
});

// "params": {}
RPC.addHandler('action.devices.commands.mediaStop', function(data) {
	IR.Sender.NEC.pwm(IR_PIN, IR_CODES.STOP);
});