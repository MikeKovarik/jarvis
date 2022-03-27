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


const tvCore = Base => class extends Base {

	static entityType = 'media_player'

	pressButton = button => {
		this.callService('webostv', 'button', {button})
	}

	callCommand = async (command, payload) => {
		this.callService('webostv', 'command', {command, payload})
	}

	setChannel = async media_content_id => {
		const media_content_type = 'channel'
		this.callService('media_player', 'play_media', {media_content_id, media_content_type})
	}

    setSource(source) {
        this.callService('media_player', 'select_source', {source})
    }

}

const mediaPlayerMute = Base => class extends Base {

    get muted() {
		return this.state.media_player?.attributes?.is_volume_muted ?? false
    }

    mute = () => this.#setMute(true)

	unmute = () => this.#setMute(false)

	#setMute(is_volume_muted) {
        this.callService('media_player', 'volume_mute', {is_volume_muted})
	}

}

const mediaPlayerVolume = Base => class extends Base {

    setVolume(volume_level) {
		volume_level = Number(volume_level.toFixed(2))
        this.callService('media_player', 'volume_set', {volume_level})
    }

}

class MyTvCard extends mixin(LitElement, hassData, tvCore, mediaPlayerVolume, mediaPlayerMute) {

	getCardSize = () => 6

	//listenToGlobalKeyboardEvents = true
	listenToGlobalKeyboardEvents = false

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
			padding: 0.5rem;
			--slider-size: 5rem;
		}

		#volume-slider {
			--color-rgb: 120, 180, 250;
			border-radius: 0.5rem;
			overflow: hidden;
		}
		#volume-slider awesome-button {
			margin: 0;
			width: var(--slider-size);
			height: 4.25rem;
			background-color: transparent;
			pointer-events: auto;
		}

		#mute {
			--color-rgb: 255, 255, 255;
		}
		#unmute {
			--color-rgb: 255, 30, 10;
			--bg-opacity: 0.2;
		}

		awesome-grid {
			--button-size: 5rem;
		}
		awesome-grid[columns="4"] {
			--button-size: 4rem;
		}
			.main-grid awesome-button,
			awesome-grid awesome-button {
				--color-rgb: 255, 255, 255;
				width: var(--button-size);
				height: var(--button-size);
			}
		#color-red {
			color: red;
		}
		#current-channel {
			grid-row: 1/ span 2;
			grid-column: 1/ span 3;
		}

		#volume-slider,
		#current-channel {
			width: unset;
			height: unset;
		}

		.main-grid {
			--button-size: 5rem;
			display: grid;
			gap: 0.5rem;
			grid-template-columns: repeat(5, 1fr);
			width: min-content;
		}
			.main-grid > * {
				min-width: var(--button-size);
				min-height: var(--button-size);
			}
	`

	// adaptive max-volume
	// tv = 0.18
	// xbox = 0.3

	render() {
		const {state} = this
		const {volume_level, sound_output, friendly_name, source, media_title} = state.media_player?.attributes ?? {}

		return html`
			<ha-card>
				<div class="main-grid">
					<awesome-button id="current-channel">${[source, media_title].filter(a => a).join(' | ')}</awesome-button>
					<awesome-button icon="mdi:numeric"></awesome-button>
					<awesome-button @click=${() => this.pressButton('GUIDE')} icon="mdi:format-list-numbered"></awesome-button>
					<awesome-button @click=${() => this.pressButton('EXIT')}>EXIT</awesome-button>
					<awesome-button @click=${() => this.pressButton('INFO')}>INFO</awesome-button>
					<awesome-button icon="mdi:play-pause" @click="${() => this.callService('media_player', 'media_play_pause')}"></awesome-button>
					<awesome-button icon="mdi:play"></awesome-button>
					<awesome-button icon="mdi:pause"></awesome-button>
					<awesome-button icon="mdi:import"></awesome-button>
					<awesome-button @click=${() => this.pressButton('RED')} icon="mdi:circle" id="color-red"></awesome-button>

					<awesome-slider
					id="volume-slider"
					vertical inverted
					value=${volume_level}
					min="0"
					max="0.25"
					step="0.01"
					.formatValue="${val => (val * 100).toFixed(0)}"
					@input="${e => this.setVolume(e.detail)}"
					style="grid-column: 5; grid-row: 1 / span 4;"
					>
						<awesome-button slot="end"   icon="mdi:plus"  @click="${() => this.callService('media_player', 'volume_up')}"></awesome-button>
						<awesome-button slot="start" icon="mdi:minus" @click="${() => this.callService('media_player', 'volume_down')}"></awesome-button>
					</awesome-slider>

					${this.muted
						? html`<awesome-button style="grid-column: 5; grid-row: 5;" icon="mdi:volume-mute" id="unmute" @click="${this.unmute}"></awesome-button>`
						: html`<awesome-button style="grid-column: 5; grid-row: 5;" icon="mdi:volume-mute" id="mute" @click="${this.mute}"></awesome-button>`
					}
				</div>

				<br>

				<awesome-grid padded columns="3">
					<awesome-button @click=${() => this.pressButton('HOME')}  icon="mdi:home-outline"></awesome-button>
					<awesome-button @click=${() => this.pressButton('UP')}    icon="mdi:chevron-up"></awesome-button>
					<div></div>

					<awesome-button @click=${() => this.pressButton('LEFT')}  icon="mdi:chevron-left"></awesome-button>
					<awesome-button @click=${() => this.pressButton('ENTER')}>OK</awesome-button>
					<awesome-button @click=${() => this.pressButton('RIGHT')} icon="mdi:chevron-right"></awesome-button>

					<awesome-button @click=${() => this.pressButton('BACK')} icon="mdi:undo-variant"></awesome-button>
					<awesome-button @click=${() => this.pressButton('DOWN')}  icon="mdi:chevron-down" ></awesome-button>
					<awesome-button @click=${() => this.pressButton('SETTINGS')} icon="mdi:cog-outline"></awesome-button>
				</awesome-grid>

				<hr>

				<awesome-grid padded columns="3">
					<awesome-button @click=${() => this.pressButton('1')} icon="mdi:numeric-1"></awesome-button>
					<awesome-button @click=${() => this.pressButton('2')} icon="mdi:numeric-2"></awesome-button>
					<awesome-button @click=${() => this.pressButton('3')} icon="mdi:numeric-3"></awesome-button>
					<awesome-button @click=${() => this.pressButton('4')} icon="mdi:numeric-4"></awesome-button>
					<awesome-button @click=${() => this.pressButton('5')} icon="mdi:numeric-5"></awesome-button>
					<awesome-button @click=${() => this.pressButton('6')} icon="mdi:numeric-6"></awesome-button>
					<awesome-button @click=${() => this.pressButton('7')} icon="mdi:numeric-7"></awesome-button>
					<awesome-button @click=${() => this.pressButton('8')} icon="mdi:numeric-8"></awesome-button>
					<awesome-button @click=${() => this.pressButton('9')} icon="mdi:numeric-9"></awesome-button>
					<div></div>
					<awesome-button @click=${() => this.pressButton('0')} icon="mdi:numeric-0"></awesome-button>
					<div></div>
				</awesome-grid>

				<div>
					status: ${this.on ? 'ON' : 'OFF'}
					${this.on
						? html`<button @click=${() => this.turnOff()}>OFF</button>`
						: html`<button @click=${() => this.turnOn()}>ON</button>`}
				</div>
				<div>
					source: ${source}
				</div>
				<div>
					media_title: ${media_title}
				</div>
				${this.inputSources?.map(source => html`<button @click=${() => this.setSource(source)}>${source}</button>`)}

				<br>

				<!--
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
				-->
				<br>
				<button @click=${() => this.pressButton('CHANNELUP')}>CHANNELUP</button>
				<button @click=${() => this.pressButton('CHANNELDOWN')}>CHANNELDOWN</button>
				<br>
				<button @click=${() => this.pressButton('PLAY')}>PLAY</button>
				<button @click=${() => this.pressButton('PAUSE')}>PAUSE</button>
				<br>
				<br>
				<hr>
				apps
				<br>
				<button @click=${() => this.pressButton('NETFLIX')}>NETFLIX</button>
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
			</ha-card>
		`
	}

}

const removeDiacritics = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
//const removeUnwantedCharacters = str => str.replace(/\s+/g, '')
const removeUnwantedCharacters = str => str.replace(/[^a-zA-Z\d\s]/g, ' ').replace(/\s+/g, '-')
const slugifyString = str => removeUnwantedCharacters(removeDiacritics(str.toLowerCase()))
const slugify = str => str ? slugifyString(str) : undefined

class MyTvButtonCard extends mixin(LitElement, hassData, tvCore) {

	static entityType = 'media_player'

	static styles = css`
		ha-card {
			/*
			height: 80px;
			font-size: 12px;
			*/
			height: 48px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
	`

	getCardSize = () => 2

	setConfig(arg) {
		super.setConfig(arg)
		this.name         = this.config.name
		this.fullName     = this.config.fullName
		this.displayName  = this.name.trim()
		this.nameSlug     = slugify(this.name)
		this.fullNameSlug = slugify(this.fullName)
	}

	onStateUpdate() {
		//const {media_content_type} = this.state.attributes // 'channel'
		//const {source} = this.state.attributes // 'Live TV'
		const {state, config} = this
		const {media_player} = state

		//this.sources = this.state.media_player?.attributes?.source_list ?? []
		//this.sourceSlugs = this.sources.map(slugifyString)

		this.source = media_player?.attributes?.source
		this.sourceSlug = slugify(this.source)

		this.channel = media_player?.attributes?.media_title
		this.channelSlug = slugify(this.channel)

		if (this.channelSlug) {
			this.selected = this.fullNameSlug
				? this.channelSlug.startsWith(this.fullNameSlug)
				: this.channelSlug.startsWith(this.nameSlug)
		} else if (this.sourceSlug) {
			this.selected = this.fullNameSlug
				? this.sourceSlug.startsWith(this.fullNameSlug)
				: this.sourceSlug.startsWith(this.nameSlug)
		} else {
			this.selected = false
		}
	}

	get style() {
		return {
			color: this.selected ? 'cyan' : ''
		}
	}

	onClick = () => this.setChannel(this.config.channel ?? this.config.name)

	render() {
		const {displayName} = this
		return html`
			<ha-card
			@click=${this.onClick}
			style=${styleMap(this.style)}
			>
				${displayName}
			</ha-card>
		`
		/*
				name: ${this.name}
				|
				nameSlug: ${this.nameSlug}
				<br>
				fullName: ${this.fullName}
				|
				fullNameSlug: ${this.fullNameSlug}
				<br>
				channel: ${this.channel}
				|
				channelSlug: ${this.channelSlug}
				<div style="font-size: 9px">${this.sourceSlugs?.join(', ')}</div>
		*/
	}

}

customElements.define('my-tv-card', MyTvCard)
customElements.define('my-tv-button-card', MyTvButtonCard)