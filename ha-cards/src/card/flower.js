import {html, css} from 'lit'
import {slickElement, hassData, resizeObserver} from '../mixin/mixin.js'
import {clamp, DEBUG} from '../util/util.js'
import api from '../util/backend.js'


const isDev = !window.hassConnection
const localPath = isDev ? 'http://localhost/' : '/local/'
const imageLibPath      = localPath + 'flora/images/'
const customUploadsPath = localPath + 'flora/uploads/'
const dataPath          = localPath + 'flora/data.js'

function prevent(e) {
	e.preventDefault()
	e.stopPropagation()
}

const dbReady = new Promise(async (resolve, reject) => {
	try {
		const {default: dbArray} = await import(dataPath)
		const entries = dbArray.map(entry => [getFlowerKey(entry[0]), entry])
		const dbMap = new Map(entries)
		resolve(dbMap)
	} catch (err) {
		reject(err)
	}
})

const getFlowerFileName = str => str?.toLowerCase()
const getFlowerKey      = str => getFlowerFileName(str)?.replace(/[^a-z ]/g, '')

class FlowerCard extends slickElement(hassData, resizeObserver) {

	static entityType = 'plant'

	getCardSize = () => 2

	loading = true

	static properties = {
		loading: {type: Boolean},
		errorMessage: {type: String},
		dbEntry: {type: Object},
	}

	async setConfig(config) {
		super.setConfig(config)
		this.entityIdSlug = config.entity.split('.')[1]
		const userImageParam = config.photo ?? config.image
		this.customImagePath  = userImageParam ? localPath + userImageParam : undefined
		this.uploadImagePath  = this.getImagePath(this.entityIdSlug, customUploadsPath)
		this.titleImagePath   = this.getImagePath(getFlowerFileName(config.title), imageLibPath)   // user's card title: "Křoví"
		this.nameImagePath    = this.getImagePath(getFlowerFileName(config.name), imageLibPath)    // flowers name: "Buxus microphylla var. insularis"
		this.speciesImagePath = this.getImagePath(getFlowerFileName(config.species), imageLibPath) // flowers species: "buxus megistophylla"

		try {
			this.loading = true
			const db = await dbReady

			this.dbEntry = db.get(getFlowerKey(config.name))
						?? db.get(getFlowerKey(config.species))
						?? db.get(getFlowerKey(config.title))

			this.loading = false
		} catch (err) {
			this.errorMessage = err.message
		}
	}

	static styles = css`
		:host,
		* {
			box-sizing: border-box;
		}
		:host {
			display: block;
			user-select: none;
		}

		:host(.small) {
			--aspect-ratio: 1 / 1;
			--flower-header-size: 1rem;
			--bg-position: center top;
		}

		:host,
		:host(.medium) {
			--aspect-ratio: 4 / 3;
			--flower-header-size: 1.125rem;
			--bg-position: center 80%;
		}

		:host(.large) {
			--aspect-ratio: 16 / 9;
			--flower-header-size: 1.5rem;
			--flower-header-line-height: 2rem;
			--bg-position: center 70%;
		}

		ha-card {
			background-size: cover;
			background-position: var(--bg-position);
			position: relative;
			overflow: hidden;
		}
		:host(.dragover) {
			opacity: 0.6;
		}

			#content {
				aspect-ratio: var(--aspect-ratio);
				max-height: 320px;
				padding: 1rem;
				position: relative;
				display: flex;
				flex-direction: row-reverse;
			}
				awesome-button {
					width: 2.5rem;
					height: 2.5rem;
					margin-right: -0.5rem;
					margin-top: -0.5rem;
					position: relative;
				}
					awesome-button input {
						position: absolute;
						visibility: hidden;
					}
					awesome-button label {
						position: absolute;
						inset: 0;
						cursor: pointer;
					}

			#details {
				width: 100%;
				backdrop-filter: blur(5px);
				display: grid;
				padding: 1rem;
				gap: 0.5rem;
				grid-template-columns: repeat(2, 1fr);
			}
			#details::after {
				content: '';
				position: absolute;
				inset: 0;
				background-color: var(--card-background-color);
				opacity: 0.9;
				z-index: -1;
			}

			h2 {
				grid-column: span 2;
				margin: 0;
				padding: 0;
				display: block;
				text-transform: capitalize;
				font-weight: 400;
				font-size: var(--flower-header-size);
				line-height: var(--flower-header-line-height);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
			}
	`

	getImagePath(name, root) {
		if (!name) return undefined
		if (name.startsWith('.') || name.startsWith('/')) return name
		if (!root.endsWith('/')) root += '/'
		name = encodeURIComponent(name.toLowerCase())
		return `${root}${name}.jpg`
	}

	get backgroundImage() {
		return [
			this.objectUrl,
			this.customImagePath,
			`${this.uploadImagePath}?random=${this.lastUploadHash}`,
			this.titleImagePath,
			this.nameImagePath,
			this.speciesImagePath,
		]
		.filter(a => a)
		.map(path => `url('${path}')`)
		.join(', ')
	}

	breakpoints = [200, 300]

	get sizeClass() {
		if (this.width <= 200) return 'small'
		if (this.width <= 300) return 'medium'
		return 'large'
	}

	isDraggingOver = false

	onDropEnter = async e => {
		prevent(e)
		const lastVal = this.isDraggingOver
		this.isDraggingOver = true
		this.requestUpdate(this.isDraggingOver, lastVal)
	}

	onDropLeave = async e => {
		prevent(e)
		const lastVal = this.isDraggingOver
		this.isDraggingOver = false
		this.requestUpdate(this.isDraggingOver, lastVal)
	}

	onDrop = async e => {
		this.onDropLeave(e)
		this.handleFiles(e.dataTransfer.files)
	}

	onFileSelect = e => this.handleFiles(e.target.files)

	lastUploadHash = 0

	handleFiles = async files => {
		if (files.length === 0) return
		const [file] = Array.from(files)

		//http://localhost:3001/flower
		await api.post(`/flower/${this.entityIdSlug}`, file)
		this.lastUploadHash = Date.now()
		const resizedPhotoBlob = await fetch(this.uploadImagePath + `?random=${this.lastUploadHash}`).then(res => res.blob())
		this.objectUrl = URL.createObjectURL(resizedPhotoBlob)
		this.requestUpdate()
	}

	renderCharts() {
		const {config, state, entity} = this
		const attrs = entity?.attributes
		const units = entity?.attributes?.unit_of_measurement_dict
        
		if (this.errorMessage) return this.errorMessage

		if (!this.loading && !this.dbEntry) {
			const names = [config.name, config.species, config.title].filter(a => a)
			if (names.length)
				return `Couldn't find any data for "${names.join('" or "')}"`
			else
				return `Couldn't find any data. No flower name was given`
		}

		const [
			name, species,
			brightnessMin, brightnessMax,
			temperatureMin, temperatureMax,
			moistureMin, moistureMax,
			conductivityMin, conductivityMax,
		] = this.dbEntry ?? []

		const chartData = [{
			unit: units.temperature,
			val: attrs?.temperature,
			min: temperatureMin,
			max: temperatureMax,
			icon: "mdi:thermometer-low",
		}, {
			unit: units.brightness,
			val: attrs?.brightness,
			min: brightnessMin,
			max: brightnessMax,
			icon: "hass:white-balance-sunny",
		}, {
			unit: units.moisture,
			val: attrs?.moisture,
			min: moistureMin,
			max: moistureMax,
			icon: "mdi:water-outline",
		}, {
			unit: units.conductivity,
			val: attrs?.conductivity,
			min: conductivityMin,
			max: conductivityMax,
			icon: "mdi:emoticon-poop",
		}]

		return chartData.map(({unit, val, min, max, icon}) => html`
			<slick-icon-chart icon="${icon}" .val="${val}" .min="${min}" .max="${max}"
			title="${val} ${unit} | min ${min} ${unit} | max ${max} ${unit}">
				${val} ${unit}
			</slick-icon-chart>
		`)

		// TODO
		return html`
			${DEBUG ? html`
				<pre style="grid-column: span 2; white-space: pre-line; font-size: 12px">
					temperature:  ${attrs?.temperature}  (min ${temperatureMin} max ${temperatureMax})
					brightness:   ${attrs?.brightness}   (min ${brightnessMin} max ${brightnessMax})
					moisture:     ${attrs?.moisture}     (min ${moistureMin} max ${moistureMax})
					conductivity: ${attrs?.conductivity} (min ${conductivityMin} max ${conductivityMax})
				</pre>
			` : ''}
		`
	}

	render() {
		const {config, state, entity} = this
		const title = config.title ?? config.name ?? config.species

		this.className = [
			this.sizeClass,
			this.isDraggingOver ? 'dragover' : ''
		].join(' ')

		return html`
			<ha-card style="background-image: ${this.backgroundImage}">
				<div id="content"
				@dragenter="${this.onDropEnter}"
				@dragover="${this.onDropEnter}"
				@dragleave="${this.onDropLeave}"
				@drop="${this.onDrop}">
					${api.connected ? html`
						<awesome-button icon="mdi:camera-outline">
							<input type="file" id="file" accept="image/*;capture=camera" @change="${this.onFileSelect}">
							<label for="file"></label>
						</awesome-button>
					` : ''}
				</div>
				<div id="details">
					<h2>${title}</h2>
					${this.renderCharts()}
				</div>
			</ha-card>
		`
		/*
		<br>friendly_name: ${attrs?.friendly_name}
		<br>battery: ${attrs?.battery} ${units.battery}
		*/
	}

}

class IconChart extends slickElement() {

	static properties = {
		val: {type: Number},
		min: {type: Number},
		max: {type: Number},
		icon: {type: String},
		color: {type: String, reflect: true},
	}

	static styles = css`
		:host {
			--color: rgb(128, 128, 128);
		}
		:host([color="red"]) {
			--color: rgb(255, 48, 58);
		}
		:host([color="orange"]) {
			--color: rgb(205, 140, 40);
		}
		:host([color="green"]) {
			--color: rgb(105, 200, 10);
		}

		:host {
			display: flex;
			align-items: center;
			position: relative;
			overflow: hidden;
		}
			slot {
				position: absolute;
				left: 24px;
				top: 0px;
				bottom: 0px;
				font-size: 12px;
				z-index: 1;
				display: inline-flex;
				align-items: center;
				white-space: nowrap;
			}
			ha-icon {
				position: absolute;
				left: -2px;
				transform: scale(0.5);
				z-index: 99;
			}
			.bar {
				height: 18px;
				width: 100%;
				border-radius: 3px;
				background-color: rgba(128, 128, 128, 0.2);
				position: relative;
				overflow: hidden;
				display: flex;
			}
				.indicator,
				.bar::after {
					display: block;
					height: 100%;
					background-color: var(--color);
				}
				.indicator {
					padding-left: 0.25rem;
					width: 0%;
					opacity: 0.5;
				}
				.bar::after {
					content: '';
					flex: 1;
					opacity: 0.15;
				}
	`

	percentageToColor(val) {
		if (val <= 0 || val >= 100) return 'red'
		if (val <= 15 || val >= 85) return 'orange'
		return 'green'
	}

	updated(map) {
		if (this.val === undefined || this.min === undefined || this.max === undefined) {
			// loading state should not have any color
			this.percentage = 0
			this.color = undefined
		} else {
			const shiftedVal = this.val - this.min
			const shiftedMax = this.max - this.min
			this.percentage = clamp((shiftedVal / shiftedMax) * 100, 0, 100)
			this.color = this.percentageToColor(this.percentage)
		}
	}

	render() {
		return html`
			<ha-icon icon="${this.icon}"></ha-icon>
			<slot></slot>
			<div class="bar">
				<div class="indicator" style="width: calc(${this.percentage}% - 0.25rem)"></div>
			</div>
		`
	}

}


/*
EXAMPLE OF THE FORMAT:
first is name, second is species

["Allium schoenoprasum", "allium oschaninii", 3500, 50000, 8, 35, 15, 60, 350, 2000],
["Allium scorodoprasum", "allium oschaninii", 3500, 50000, 8, 35, 15, 60, 350, 2000],
["Allium sphaerocephalon", "allium oschaninii", 3500, 50000, 8, 35, 15, 60, 350, 2000],
["Allium stipitatum", "allium oschaninii", 3500, 50000, 8, 35, 15, 60, 350, 2000],
["Allium tuberosum", "allium tuberosum", 2500, 110000, 6, 35, 25, 65, 50, 2000],
*/


customElements.define('slick-icon-chart', IconChart)
customElements.define('slick-flower-card', FlowerCard)