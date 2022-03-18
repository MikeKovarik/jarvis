import { LitElement, html, css } from 'lit'
import { AwesomeCardBase, AwesomeToggleCard } from './base.js'
import {
	createLongLivedTokenAuth,
	createConnection,
	subscribeEntities,
} from 'home-assistant-js-websocket'

const accessToken =
	'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiIwN2FjOWUwMzFmOGY0MWY1OTMzNTY0YWIxNjIzNmRkMSIsImlhdCI6MTY0NzU1NDUxMiwiZXhwIjoxOTYyOTE0NTEyfQ.QY5t7_Maz_oMDO9PNvFxCLQZfbGt9fbVmYLKvE0DAak'

function sanitizeNums(string) {
	const lowercase = string.toLowerCase()
	const split = lowercase.split('')
	// with zero shifted to index 0
	return [...split.slice(0, 9), ...split.slice(9)]
}

const localeNumString = '+ěščřžýáíé'

const localeNumRow = sanitizeNums(localeNumString)

function translateKey(e) {
	if (e.keyCode === 32) return 'PAUSE' // space
	switch (e.key) {
		case 'ArrowLeft':
			return 'LEFT'
		case 'ArrowRight':
			return 'RIGHT'
		case 'ArrowUp':
			return 'UP'
		case 'ArrowDown':
			return 'DOWN'
		case 'Enter':
			return 'ENTER'
		case 'Backspace':
			return 'BACK'
		case 'Escape':
			return 'BACK'
		case 'AudioVolumeUp':
			return 'VOLUMEUP'
		case 'AudioVolumeDown':
			return 'VOLUMEDOWN'
		case localeNumRow[0]:
		case localeNumRow[0].toUpperCase():
		case '0':
			return '0'
		case localeNumRow[1]:
		case localeNumRow[1].toUpperCase():
		case '1':
			return '1'
		case localeNumRow[2]:
		case localeNumRow[2].toUpperCase():
		case '2':
			return '2'
		case localeNumRow[3]:
		case localeNumRow[3].toUpperCase():
		case '3':
			return '3'
		case localeNumRow[4]:
		case localeNumRow[4].toUpperCase():
		case '4':
			return '4'
		case localeNumRow[5]:
		case localeNumRow[5].toUpperCase():
		case '5':
			return '5'
		case localeNumRow[6]:
		case localeNumRow[6].toUpperCase():
		case '6':
			return '6'
		case localeNumRow[7]:
		case localeNumRow[7].toUpperCase():
		case '7':
			return '7'
		case localeNumRow[8]:
		case localeNumRow[8].toUpperCase():
		case '8':
			return '8'
		case localeNumRow[9]:
		case localeNumRow[9].toUpperCase():
		case '9':
			return '9'
		case 'AltGraph':
		case 'Alt':
		case 'Home':
			return 'HOME'
		case 'i':
		case 'I':
			return 'INFO'
		case 'g':
		case 'G':
			return 'GUIDE'
		case 'r':
		case 'R':
			return 'RED'
		case 'c':
		case 'C':
			return 'RED'
	}
}

class MyTvCard extends AwesomeToggleCard {
	listenToGlobalKeyboardEvents = true

	static entityType = 'media_player'
	static excludedInputs = ['apps', 'home dashboard', 'spotify', 'twitch']

	constructor() {
		super()
		// todo
		if (this.listenToGlobalKeyboardEvents) {
			document.addEventListener('keyup', this.onKeyUp)
		}
		setTimeout(() => {
			console.log(this._hass)
			this.connect()
		}, 1000)
	}

	async connect() {
		console.log('~ connect')
		let auth = await createLongLivedTokenAuth(
			'http://jarvis-hub:8123',
			accessToken
		)
		console.log('~ auth', auth)
		const connection = await createConnection({ auth })
		console.log('~ connection', connection)
		//subscribeEntities(connection, ent => console.log('subscribeEntities', ent))
		connection.subscribeEvents(x => console.log('subscribeEvents', x))
		const { entity_id } = this.state.media_player
		connection.subscribeMessage(x => console.log('trigger', x), {type: "subscribe_trigger", trigger: {entity_id}})
	}

	get on() {
		return this.state.media_player?.state === 'on'
	}

	onKeyUp = e => {
		const lgButton = translateKey(e)
		if (lgButton) this.pressButton(lgButton)
	}

	setInput(source) {}

	onStateUpdate() {
		const { excludedInputs } = this.constructor
		this.inputSources = (
			this.state.media_player?.attributes?.source_list ?? []
		).filter(
			item =>
				!excludedInputs.some(source =>
					item.toLowerCase().startsWith(source)
				)
		)
	}

	pressButton = button => {
		const { entity_id } = this.state.media_player
		this._hass.callService('webostv', 'button', { entity_id, button })
	}

	setChannel = async media_content_id => {
		const { entity_id } = this.state.media_player
		const out = await this._hass.callService('media_player', 'play_media', {
			entity_id,
			media_content_id,
			media_content_type: 'channel',
		})
		console.log('~ out', out)
	}

	runCommand = async (command, payload) => {
		const { entity_id } = this.state.media_player
		const out = await this._hass.callService('webostv', 'command', {
			entity_id,
			command,
			payload,
		})
		console.log(command, out.context.id)
	}

	launchYoutube = () => {
		this.runCommand('system.launcher/launch', {
			id: 'youtube.leanback.v4',
			contentId: 'G1IbRujko-A',
		})
	}

	debug = async () => {
		await this.runCommand('system/getSystemInfo')
		await this.runCommand('tv/getChannelProgramInfo')
		await this.runCommand('tv/getCurrentChannel')
		await this.runCommand('tv/getExternalInputList')
		await this.runCommand('api/getServiceList')
		await this.runCommand(
			'com.webos.applicationManager/getForegroundAppInfo'
		)
		await this.runCommand('com.webos.applicationManager/listLaunchPoints')
		await this.runCommand('com.webos.service.appstatus/getAppStatus')
		await this.runCommand('system.launcher/getAppState')
	}

	render() {
		const { state } = this
		console.log('~ state', state)
		return html`
			<ha-card>
				<div>
					status: ${this.on ? 'ON' : 'OFF'}
					${this.on
						? html`<button @click=${() => this.turnOff()}>
								OFF
						  </button>`
						: html`<button @click=${() => this.turnOn()}>
								ON
						  </button>`}
				</div>
				<div>
					volume_level:
					${state.media_player?.attributes?.volume_level}
				</div>
				<div>
					input source: ${state.media_player?.attributes?.source}
				</div>
				<div>
					TV station: ${state.media_player?.attributes?.media_title}
				</div>
				${this.inputSources.map(
					source => html`<div>
						<button @click=${() => this.setInput(source)}>
							${source}
						</button>
					</div>`
				)}

				<hr />

				buttons

				<br />

				<button @click=${() => this.pressButton('HOME')}>HOME</button>
				<button @click=${() => this.pressButton('BACK')}>BACK</button>
				<button @click=${() => this.pressButton('ENTER')}>ENTER</button>
				<button @click=${() => this.pressButton('EXIT')}>EXIT</button>
				<button @click=${() => this.pressButton('INFO')}>INFO</button>
				<button @click=${() => this.pressButton('GUIDE')}>GUIDE</button>
				<br />
				<button @click=${() => this.pressButton('LEFT')}>LEFT</button>
				<button @click=${() => this.pressButton('RIGHT')}>RIGHT</button>
				<button @click=${() => this.pressButton('DOWN')}>DOWN</button>
				<button @click=${() => this.pressButton('UP')}>UP</button>
				<br />
				<button @click=${() => this.pressButton('RED')}>RED</button>
				<button @click=${() => this.pressButton('GREEN')}>GREEN</button>
				<button @click=${() => this.pressButton('YELLOW')}>
					YELLOW
				</button>
				<button @click=${() => this.pressButton('BLUE')}>BLUE</button>
				<br />
				<button @click=${() => this.pressButton('VOLUMEUP')}>
					VOLUMEUP
				</button>
				<button @click=${() => this.pressButton('VOLUMEDOWN')}>
					VOLUMEDOWN
				</button>
				<br />
				<button @click=${() => this.pressButton('CHANNELUP')}>
					CHANNELUP
				</button>
				<button @click=${() => this.pressButton('CHANNELDOWN')}>
					CHANNELDOWN
				</button>
				<br />
				<button @click=${() => this.pressButton('PLAY')}>PLAY</button>
				<button @click=${() => this.pressButton('PAUSE')}>PAUSE</button>
				<br />
				<button @click=${() => this.pressButton('NETFLIX')}>
					NETFLIX
				</button>
				<br />
				<button @click=${() => this.pressButton('0')}>0</button>
				<button @click=${() => this.pressButton('1')}>1</button>
				<button @click=${() => this.pressButton('2')}>2</button>
				<button @click=${() => this.pressButton('3')}>3</button>
				<button @click=${() => this.pressButton('4')}>4</button>
				<button @click=${() => this.pressButton('5')}>5</button>
				<button @click=${() => this.pressButton('6')}>6</button>
				<button @click=${() => this.pressButton('7')}>7</button>
				<button @click=${() => this.pressButton('8')}>8</button>
				<button @click=${() => this.pressButton('9')}>9</button>
				<hr />
				<button @click=${() => this.debug()}>debug</button>
				<button @click=${() => this.launchYoutube()}>
					youtube vid
				</button>
				<hr />
				channels
				<br />
				<button @click=${() => this.setChannel('NOVA')}>NOVA</button>
				<button @click=${() => this.setChannel('Prima COOL')}>
					Prima COOL
				</button>
			</ha-card>
		`
	}
}

customElements.define('my-tv-card', MyTvCard)
