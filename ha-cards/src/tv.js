import {LitElement, html, css} from 'lit'
import {styleMap} from 'lit-html/directives/style-map.js'
import {mixin, hassData, onOff} from './mixin/mixin.js'
import {timeout} from './util/util.js'


function sanitizeNums(string) {
	const lowercase = string.toLowerCase()
	const split = lowercase.split('')
	// with zero shifted to index 0
	return [...split.slice(0, 9), ...split.slice(9)]
}

const localeNumString  = '+ěščřžýáíé'

const localeNumRow = sanitizeNums(localeNumString)

function translateKey(e) {
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

	pressButton = button => this.callService('webostv', 'button', {button})

	callCommand = (command, payload) => this.callService('webostv', 'command', {command, payload})

	setChannel = async media_content_id => {
		const media_content_type = 'channel'
		return this.callService('media_player', 'play_media', {media_content_id, media_content_type})
	}

    setSource = source => this.callService('media_player', 'select_source', {source})

    turnOn = () => {
		const {mac} = this.config
        return this.config.mac
            ? this._hass.callService('wake_on_lan', 'send_magic_packet', {mac})
			: this.callService('media_player', 'turn_on')
    }

	turnOff = () => this.callService('media_player', 'turn_off')
}

const mediaPlayerMute = Base => class extends Base {

    get muted() {
		return this.state.media_player?.attributes?.is_volume_muted ?? false
    }

    mute = () => this.#callMuteService(true)

	unmute = () => this.#callMuteService(false)

	#callMuteService(is_volume_muted) {
        this.callService('media_player', 'volume_mute', {is_volume_muted})
	}

}

const mediaPlayerVolume = Base => class extends Base {

    setVolume(volume_level) {
		volume_level = Number(volume_level.toFixed(2))
        this.callService('media_player', 'volume_set', {volume_level})
    }

}

const resizeMixin = Base => class extends Base {

	connectedCallback() {
		super.connectedCallback()
		this.resizeObserver = new ResizeObserver(this.onResize)
		this.resizeObserver.observe(this)
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		this.resizeObserver.unobserve(this)
		this.resizeObserver = undefined
	}

	onResize = entries => {
		console.log('onResize', entries[0].contentRect)
	}

}

class MyTvCard extends mixin(LitElement, hassData, onOff, tvCore, mediaPlayerVolume, mediaPlayerMute) {

	getCardSize = () => 6

	//listenToGlobalKeyboardEvents = true
	listenToGlobalKeyboardEvents = false

	static excludedInputs = ['apps', 'home dashboard', 'spotify', 'twitch']

	connectedCallback() {
		super.connectedCallback()
		if (this.listenToGlobalKeyboardEvents) {
			console.log('subscribing')
			document.addEventListener('keyup', this.onKeyUp)
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback()
			console.log('unsubbing')
		window.removeEventListener('keyup', this.onKeyUp)
	}

	onKeyUp = e => {
		if (e.keyCode === 32) return this.playPause() // space
		const lgButton = translateKey(e)
		if (lgButton) this.pressButton(lgButton)
	}

	playPause = () => this.callService('media_player', 'media_play_pause')

	onStateUpdate() {
		const {excludedInputs} = this.constructor
		this.inputSources = (this.state.media_player?.attributes?.source_list ?? [])
			.filter(item => !excludedInputs.some(source => item.toLowerCase().startsWith(source)))
	}

	static styles = css`
		:host {
			display: block;
		}

		ha-card#main {
			padding: 0.5rem;
		}

		#volume-slider {
			--color-rgb: 120, 180, 250;
			border-radius: 0.5rem;
			overflow: hidden;
		}
		#volume-slider awesome-button {
			margin: 0;
			height: 4.25rem;
			background-color: transparent;
			pointer-events: auto;
		}

		awesome-button {
			--color-rgb: 255, 255, 255;
		}
		#mute {
			--color-rgb: 255, 255, 255;
		}
		#unmute {
			--color-rgb: 255, 30, 10;
			--bg-opacity: 0.2;
		}

		.color-red {
			color: red;
		}
		#current-channel {
			text-align: center;
			background-size: cover;
			background-position: center;
		}

		#main-grid {
			display: grid;
			gap: 0.5rem;
			grid-template-columns: repeat(5, 1fr);
			width: min-content;
			grid-auto-rows: 1fr;
			width: 100%;
		}
			#main-grid > * {
				width: unset;
				height: unset;
				min-width: unset;
				min-height: unset;
			}

		ha-card.containerless {
			background-color: transparent;
			border-radius: 0;
			box-shadow: none;
			padding: 0;
		}
			ha-card.containerless #main-grid > * {
				background-color: var( --ha-card-background, var(--card-background-color, white) );
				border-radius: var(--ha-card-border-radius, 4px);
				box-shadow: var( --ha-card-box-shadow, 0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px 0px rgba(0, 0, 0, 0.14), 0px 1px 3px 0px rgba(0, 0, 0, 0.12) );
			}

		#sizer {
			opacity: 0;
			visibility: hidden;
			z-index: -1;
			position: relative;
			pointer-events: none;
		}
		#sizer::before {
			content: '';
			display: block;
			padding-top: 100%;
		}

	`

	// adaptive max-volume
	// tv = 0.18
	// xbox = 0.3

	render() {
		const {state} = this
		const {volume_level, sound_output, friendly_name, source, media_title, entity_picture} = state.media_player?.attributes ?? {}

		return html`
			<ha-card class="${this.config.containerless === false ? 'plain' : 'containerless'}">

				<div id="main-grid">
					<awesome-button id="current-channel" style="background-image: url('${entity_picture}')">
						${entity_picture ? '' : [source, media_title].filter(a => a).join(' | ')}
					</awesome-button>

					<awesome-button @click=${() => this.pressButton('RED')} icon="mdi:circle" class="color-red"></awesome-button>

					${this.on
						? html`<awesome-button @click=${this.turnOff} icon="mdi:power" class="color-red"></awesome-button>`
						: html`<awesome-button @click=${this.turnOn} icon="mdi:power" class="color-red"></awesome-button>`}

					<awesome-button icon="mdi:play-pause" @click="${this.playPause}"></awesome-button>

					<awesome-button style="grid-column: 1; grid-row: 2;" @click=${() => this.pressButton('CHANNELUP')}>P +</awesome-button>
					<awesome-button style="grid-column: 1; grid-row: 3;" @click=${() => this.pressButton('CHANNELDOWN')}>P -</awesome-button>
					<awesome-button style="grid-column: 1; grid-row: 4;" @click=${() => this.pressButton('GUIDE')} icon="mdi:format-list-numbered"></awesome-button>

					<awesome-button style="grid-column: 2; grid-row: 2;" @click=${() => this.pressButton('HOME')}  icon="mdi:home-outline"></awesome-button>
					<awesome-button style="grid-column: 3; grid-row: 2;" @click=${() => this.pressButton('UP')}    icon="mdi:chevron-up"></awesome-button>
					<awesome-button style="grid-column: 2; grid-row: 3;" @click=${() => this.pressButton('LEFT')}  icon="mdi:chevron-left"></awesome-button>
					<awesome-button style="grid-column: 3; grid-row: 3;" @click=${() => this.pressButton('ENTER')}>OK</awesome-button>
					<awesome-button style="grid-column: 4; grid-row: 3;" @click=${() => this.pressButton('RIGHT')} icon="mdi:chevron-right"></awesome-button>
					<awesome-button style="grid-column: 2; grid-row: 4;" @click=${() => this.pressButton('BACK')}  icon="mdi:undo-variant"></awesome-button>
					<awesome-button style="grid-column: 3; grid-row: 4;" @click=${() => this.pressButton('DOWN')}  icon="mdi:chevron-down" ></awesome-button>

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
						? html`<awesome-button icon="mdi:volume-mute" id="unmute" @click="${this.unmute}"></awesome-button>`
						: html`<awesome-button icon="mdi:volume-mute" id="mute" @click="${this.mute}"></awesome-button>`
					}

					<awesome-button @click=${() => this.pressButton('EXIT')}>EXIT</awesome-button>

					<div id="sizer"></div>
				</div>
			</ha-card>
		`
	}

	renderNumPad = () => html`
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
	`

}

/*
				<awesome-button style="grid-column: 1; grid-row: 2;" icon="mdi:chevron-up"></awesome-button>
				<awesome-button style="grid-column: 1; grid-row: 3;" icon="mdi:chevron-down"></awesome-button>
				<awesome-button style="grid-column: 1; grid-row: 5;" @click=${() => this.pressButton('INFO')}>INFO</awesome-button>
				<awesome-button icon="mdi:numeric"></awesome-button>
				<awesome-button icon="mdi:import"></awesome-button>
				<awesome-button @click=${() => this.pressButton('PLAY')} icon="mdi:play"></awesome-button>
				<awesome-button @click=${() => this.pressButton('PAUSE')} icon="mdi:pause"></awesome-button>
				<button @click=${() => this.pressButton('RED')}>RED</button>
				<button @click=${() => this.pressButton('GREEN')}>GREEN</button>
				<button @click=${() => this.pressButton('YELLOW')}>YELLOW</button>
				<button @click=${() => this.pressButton('BLUE')}>BLUE</button>
*/

const removeDiacritics = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
//const removeUnwantedCharacters = str => str.replace(/\s+/g, '')
const removeUnwantedCharacters = str => str.replace(/[^a-zA-Z\d\s]/g, ' ').replace(/\s+/g, '-')
const slugifyString = str => removeUnwantedCharacters(removeDiacritics(str.toLowerCase()))
const slugify = str => str ? slugifyString(str) : undefined

const weakmap = new WeakMap

class MyTvButtonCard extends mixin(LitElement, hassData, onOff, tvCore) {

	static entityType = 'media_player'

	static styles = css`
		ha-card {
			height: 56px;
			display: flex;
			align-items: center;
			justify-content: center;
			text-align: center;
		}

		:host {
			--color-rgb: 255, 255, 255;
		}

		ha-card.selected {
			font-weight: 500;
			color: rgb(var(--color-rgb));
			background-color: rgba(var(--color-rgb), 0.1);
		}
		ha-card:not(.selected) {
			color: rgba(var(--color-rgb), 0.6);
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

	getProcessedState() {
		const {media_player} = this.state
		if (weakmap.get(media_player)) {
			return weakmap.get(media_player)
		} else {
			const sourceNames = this.state.media_player?.attributes?.source_list ?? []
			const sourceSlugs = sourceNames.map(slugifyString)
			const sourceName = media_player?.attributes?.source
			const sourceSlug = slugify(sourceName)
			const channelName = media_player?.attributes?.media_title
			const channelSlug = slugify(channelName)
			const processed = {sourceNames, sourceSlugs, sourceName, sourceSlug, channelName, channelSlug}
			weakmap.set(media_player, processed)
			return processed
		}
	}

	onStateUpdate() {
		//const {sourceNames, sourceSlugs, source, sourceSlug, channel, channelSlug} = this.getProcessedState()
		const sourceNames = this.state.media_player?.attributes?.source_list ?? []
		const {sourceSlugs, sourceSlug, channelSlug} = this.getProcessedState()

		this.targetSourceSlug = sourceSlugs.find(this.matchesName)
		this.targetSourceName = sourceNames[sourceSlugs.indexOf(this.targetSourceSlug)]
		this.isSource = !!this.targetSourceSlug
		this.isChannel = !this.isSource

		this.selected = (this.isChannel && channelSlug && this.matchesName(channelSlug))
					 || (this.isSource && sourceSlug && this.matchesName(sourceSlug))
	}

	matchesName = slug => {
		return this.fullNameSlug
			? slug.startsWith(this.fullNameSlug)
			: slug.startsWith(this.nameSlug)
	}

	onClick = async () => {
		if (!this.on) {
			await this.turnOn()
			await timeout(1000) // just to be sure. TODO: test out if/how long is necessary.
		}
		if (this.isChannel)
			return this.setChannel(this.config.name)
		else if (this.isSource)
			return this.setSource(this.targetSourceName ?? this.config.name)
	}

	render() {
		return html`
			<ha-card
			@click=${this.onClick}
			class="${this.selected ? 'selected' : ''}"
			>
				${this.displayName}
			</ha-card>
		`
	}

}

customElements.define('my-tv-card', MyTvCard)
customElements.define('my-tv-button-card', MyTvButtonCard)