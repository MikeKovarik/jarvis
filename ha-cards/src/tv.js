import {LitElement, html, css} from 'lit'
import {styleMap} from 'lit-html/directives/style-map.js'
import {mixin, hassData} from './mixin/mixin'


function sanitizeNums(string) {
	const lowercase = string.toLowerCase()
	const split = lowercase.split('')
	// with zero shifted to index 0
	return [...split.slice(0, 9), ...split.slice(9)]
}

const localeNumString  = '+ěščřžýáíé'

const localeNumRow = sanitizeNums(localeNumString)

function translateKey(e) {
	if (e.keyCode === 32) return 'PAUSE' // space
	switch (e.key) {
		case 'ArrowLeft':       return 'LEFT'
		case 'ArrowRight':      return 'RIGHT'
		case 'ArrowUp':         return 'UP'
		case 'ArrowDown':       return 'DOWN'
		case 'Enter':           return 'ENTER'
		case 'Backspace':       return 'BACK'
		case 'Escape':          return 'BACK'
		case 'AudioVolumeUp':   return 'VOLUMEUP'
		case 'AudioVolumeDown': return 'VOLUMEDOWN'
		case localeNumRow[0]:
		case localeNumRow[0].toUpperCase():
		case '0':               return '0'
		case localeNumRow[1]:
		case localeNumRow[1].toUpperCase():
		case '1':               return '1'
		case localeNumRow[2]:
		case localeNumRow[2].toUpperCase():
		case '2':               return '2'
		case localeNumRow[3]:
		case localeNumRow[3].toUpperCase():
		case '3':               return '3'
		case localeNumRow[4]:
		case localeNumRow[4].toUpperCase():
		case '4':               return '4'
		case localeNumRow[5]:
		case localeNumRow[5].toUpperCase():
		case '5':               return '5'
		case localeNumRow[6]:
		case localeNumRow[6].toUpperCase():
		case '6':               return '6'
		case localeNumRow[7]:
		case localeNumRow[7].toUpperCase():
		case '7':               return '7'
		case localeNumRow[8]:
		case localeNumRow[8].toUpperCase():
		case '8':               return '8'
		case localeNumRow[9]:
		case localeNumRow[9].toUpperCase():
		case '9':               return '9'
		case 'AltGraph':
		case 'Alt':
		case 'Home':            return 'HOME'
		case 'i': case 'I':     return 'INFO'
		case 'g': case 'G':     return 'GUIDE'
		case 'r': case 'R':     return 'RED'
		case 'c': case 'C':     return 'RED'
	}
}


const tvControls = Base => class extends Base {

	pressButton = button => {
		const {entity_id} = this.state.media_player
		this._hass.callService('webostv', 'button', {entity_id, button})
	}

	setChannel = async media_content_id => {
		const {entity_id} = this.state.media_player
		this._hass.callService('media_player', 'play_media', {
			entity_id,
			media_content_id,
			media_content_type: 'channel'
		})
	}

    setSource(source) {
		const {entity_id} = this.state.media_player
        this._hass.callService('media_player', 'select_source', {entity_id, source})
    }

    setVolume(volume_level) {
		volume_level = Number(volume_level.toFixed(2))
		const {entity_id} = this.state.media_player
        this._hass.callService('media_player', 'volume_set', {entity_id, volume_level})
    }

	runCommand = async (command, payload) => {
		const {entity_id} = this.state.media_player
		return this._hass.callService('webostv', 'command', {
			entity_id,
			command,
			payload
		})
	}

}

class MyTvCard extends mixin(LitElement, hassData, tvControls) {

	//listenToGlobalKeyboardEvents = true
	listenToGlobalKeyboardEvents = false

	static entityType = 'media_player'
	static excludedInputs = ['apps', 'home dashboard', 'spotify', 'twitch']

	connectedCallback() {
		super.connectedCallback()
		if (this.listenToGlobalKeyboardEvents)
			document.addEventListener('keyup', this.onKeyUp)
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		window.removeEventListener('keyup', this.onKeyUp)
	}

	get on() {
		return this.state.media_player?.state === 'on'
	}

	onKeyUp = e => {
		const lgButton = translateKey(e)
		if (lgButton) this.pressButton(lgButton)
	}

	onStateUpdate() {
		const {excludedInputs} = this.constructor
		this.inputSources = (this.state.media_player?.attributes?.source_list ?? [])
			.filter(item => !excludedInputs.some(source => item.toLowerCase().startsWith(source)))
	}

	static styles = css`
		ha-card {
			display: flex;
			flex-direction: row;
			padding: 0.5rem;
		}
		#volume-slider {
			margin-left: 0.5rem;
			width: 5rem;
			height: 20rem;
			border-radius: 0.5rem;
			overflow: hidden;
		}
		awesome-slider {
			--color: 120, 180, 250;
		}
	`

	render() {
		const {state} = this
		const {volume_level, is_volume_muted, sound_output, friendly_name, source, media_title} = state.media_player?.attributes ?? {}

        console.log('~ state', state)
		return html`
			<ha-card>
				<div>
					<div>
						status: ${this.on ? 'ON' : 'OFF'}
						${this.on
							? html`<button @click=${() => this.turnOff()}>OFF</button>`
							: html`<button @click=${() => this.turnOn()}>ON</button>`}
					</div>
					<div>
						volume_level: ${volume_level}
					</div>
					<div>
						is_volume_muted: ${is_volume_muted}
					</div>
					<div>
						sound_output: ${sound_output}
					</div>
					<div>
						friendly_name: ${friendly_name}
					</div>
					<div>
						input source: ${source}
					</div>
					<div>
						TV station: ${media_title}
					</div>
					${this.inputSources.map(source => html`<div>
						<button @click=${() => this.setSource(source)}>${source}</button>
					</div>`)}

					<hr>

					buttons

					<br>

					<button @click=${() => this.pressButton('HOME')}>HOME</button>
					<button @click=${() => this.pressButton('BACK')}>BACK</button>
					<button @click=${() => this.pressButton('ENTER')}>ENTER</button>
					<button @click=${() => this.pressButton('EXIT')}>EXIT</button>
					<button @click=${() => this.pressButton('INFO')}>INFO</button>
					<button @click=${() => this.pressButton('GUIDE')}>GUIDE</button>
					<br>
					<button @click=${() => this.pressButton('LEFT')}>LEFT</button>
					<button @click=${() => this.pressButton('RIGHT')}>RIGHT</button>
					<button @click=${() => this.pressButton('DOWN')}>DOWN</button>
					<button @click=${() => this.pressButton('UP')}>UP</button>
					<br>
					<button @click=${() => this.pressButton('RED')}>RED</button>
					<button @click=${() => this.pressButton('GREEN')}>GREEN</button>
					<button @click=${() => this.pressButton('YELLOW')}>YELLOW</button>
					<button @click=${() => this.pressButton('BLUE')}>BLUE</button>
					<br>
					<button @click=${() => this.pressButton('VOLUMEUP')}>VOLUMEUP</button>
					<button @click=${() => this.pressButton('VOLUMEDOWN')}>VOLUMEDOWN</button>
					<br>
					<button @click=${() => this.pressButton('CHANNELUP')}>CHANNELUP</button>
					<button @click=${() => this.pressButton('CHANNELDOWN')}>CHANNELDOWN</button>
					<br>
					<button @click=${() => this.pressButton('PLAY')}>PLAY</button>
					<button @click=${() => this.pressButton('PAUSE')}>PAUSE</button>
					<br>
					<button @click=${() => this.pressButton('NETFLIX')}>NETFLIX</button>
					<br>
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
					<hr>
					channels
					<br>
					<button @click=${() => this.setChannel('ct 1')}>ct 1</button>
					<button @click=${() => this.setChannel('CT 2 ')}>ct 2</button>
					<button @click=${() => this.setChannel('ct 24')}>ct 24</button>
					<button @click=${() => this.setChannel('NOVA')}>NOVA</button>
					<button @click=${() => this.setChannel('nova')}>nova</button>
					<button @click=${() => this.setChannel('nova cinema')}>nova cinema</button>
					<button @click=${() => this.setChannel('prima')}>prima</button>
					<button @click=${() => this.setChannel('prima cool')}>prima cool</button>
					<button @click=${() => this.setChannel('cnn')}>cnn</button>
				</div>
				<div>
					<awesome-slider
					id="volume-slider"
					vertical inverted
					value=${volume_level}
					min="0"
					max="0.15"
					step="0.01"
					.displayValue="${val => (val * 100).toFixed(0)}"
					@input="${e => this.setVolume(e.detail)}"
					>
						<awesome-button slot="end"   icon="mdi:plus"  @click="${() => this.setVolume(volume_level + 0.01)}"></awesome-button>
						<awesome-button slot="start" icon="mdi:minus" @click="${() => this.setVolume(volume_level - 0.01)}"></awesome-button>
					</awesome-slider>
					<button @click="${() => console.log('mute')}">mute</button>
				</div>
			</ha-card>
		`
	}

}

class MyTvButtonCard extends mixin(LitElement, hassData, tvControls) {

	static entityType = 'media_player'

	static styles = css`
		ha-card {
			height: 48px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	`

	onStateUpdate() {
		//const {media_content_type} = this.state.attributes // 'channel'
		//const {source} = this.state.attributes // 'Live TV'
		const {state, config} = this
		const {media_player} = state
		this.displayName = config.prettyName ?? config.name

		const channel = media_player?.attributes?.media_title
		if (channel) {
			let channelLowerCase = channel.toLowerCase()
			let nameLowerCase = config.name.toLowerCase()
			let nameTrimmed = nameLowerCase.trim()
			console.log(channelLowerCase, '|', nameLowerCase, '|', nameTrimmed, '|', channelLowerCase.includes(nameLowerCase), channelLowerCase.includes(nameTrimmed))
		}
	}

	get selected() {
		const channel = this.state.media_player?.attributes?.media_title?.toLowerCase().trim()
		const source  = this.state.media_player?.attributes?.source?.toLowerCase().trim()
		const name = this.config.name.toLowerCase().trim()
		return !!channel?.includes(name) || !!source?.includes(name)
	}

	get style() {
		return {
			color: this.selected ? 'cyan' : ''
		}
	}

	onClick = () => this.setChannel(this.config.channel ?? this.config.name)

	render() {
        console.log(this.state, this.config)
		const {displayName} = this
		return html`
			<ha-card
			@click=${this.onClick}
			style=${styleMap(this.style)}
			>
				${displayName}
			</ha-card>
		`
	}

}

customElements.define('my-tv-card', MyTvCard)
customElements.define('my-tv-button-card', MyTvButtonCard)