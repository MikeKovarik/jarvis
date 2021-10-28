// Re-announce the device every minute.
let heartbeatInterval = 1000 * 60;

let pins = {
	// LEDS
	out1: 2,
};

let state = {
};

let whoami = {
	id: 'tv',
	name: 'TV',
	type: 'action.devices.types.TV',
	traits: [
		'action.devices.traits.OnOff',
		'action.devices.traits.Brightness',
		'action.devices.traits.Volume',
		// This trait is used for devices which are able to switch inputs.
		'action.devices.traits.AppSelector',
		// This trait is used for devices which are able to switch inputs.
		'action.devices.traits.InputSelector',
		// This trait is used for devices which are able to control media playback (for example, resuming music while it is paused).
		'action.devices.traits.TransportControl',
		// This trait belongs to devices that support TV channels on a media device.
		'action.devices.traits.Channel',
	],
	attributes: {
		// If it's not possible to confirm if the request is successfully executed or to get the state of the device.
		// For example, if the device is a traditional infrared remote, set this field to true.
		commandOnlyVolume: true,
		//Indicates if the device supports using one-way (true) or two-way (false) communication. Set this attribute to true if the device cannot respond to a QUERY intent or Report State for this trait.
		commandOnlyBrightness: true,
		// Indicates if the device can only controlled through commands, and cannot be queried for state information.
		commandOnlyOnOff: false,
		// Indicates if the device can only be queried for state information, and cannot be controlled through commands.
		queryOnlyOnOff: false,
		availableApplications: [{
			key: 'tv',
			names: [{
				name_synonym: ['tv'],
				lang: 'en'
			}]
		}, {
			key: 'youtube',
			names: [{
				name_synonym: ['youtube'],
				lang: 'en'
			}]
		}, {
			key: 'xbox',
			names: [{
				name_synonym: ['xbox'],
				lang: 'en'
			}]
		}, {
			key: 'netflix',
			names: [{
				name_synonym: ['netflix'],
				lang: 'en'
			}]
		}],
		transportControlSupportedCommands: [
			'NEXT',
			'PREVIOUS',
			'PAUSE',
			'RESUME',
			'STOP',
		],
		availableChannels: [{
			key: 'ct24',
			names: ['CT24', '24'],
			number: '8'
		}, {
			key: 'ct1',
			names: ['CT1', '1'],
			number: '8'
		}, {
			key: 'cnn',
			names: ['CNN', 'Prima CNN'],
			number: '8'
		}, {
			key: 'cool',
			names: ['Cool', 'Prima Cool'],
			number: '38'
		}, {
			key: 'nova',
			names: ['Nova'],
			number: '1'
		}]
	},
	state: state
};