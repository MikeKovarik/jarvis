import {html, css} from 'lit'
import {slickElement, hassData, resizeObserver, eventEmitter, history} from '../mixin/mixin.js'
import {DEBUG, timeSince} from '../util/util.js'
import api from '../util/backend.js'
import { Chart, registerables } from 'chart.js'
import 'moment'
import 'chartjs-adapter-moment'


Chart.register(...registerables)

let cardTools
customElements.whenDefined('card-tools').then(() => {
	cardTools = customElements.get('card-tools')
})

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

class FlowerCard extends slickElement(hassData, resizeObserver, eventEmitter) {

	static entityType = 'plant'

	getCardSize = () => 2

	loading = true

	static properties = {
		loading: {type: Boolean},
		dbErrorMessage: {type: String},
		dbEntry: {type: Object},
	}

	async setConfig(config) {
		super.setConfig(config)
		this.entityIdSlug = config.entity.split('.')[1]
		const userImageParam = config.photo ?? config.image
		this.customImagePath  = userImageParam ? localPath + userImageParam : undefined
		this.uploadImagePath  = this.getImagePath(this.entityIdSlug, customUploadsPath, this.lastUploadDate)
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
			this.dbErrorMessage = err.message
		}
	}

	get error() {
		return !!this.errorMessage
	}

	get errorMessage() {
		if (!this.entity) // todo: this is now handled in setConfig ny throwing error, but error-messages should be thought through again.
			return 'Entity not found'

		if (this.dbErrorMessage)
			return this.dbErrorMessage

		const {config} = this
		const names = [config.name, config.species, config.title].filter(a => a)

		if (names.length === 0)
			return `Flower name not defined`

		if (names.length > 0 && !this.loading && !this.dbEntry)
			return `Couldn't find "${names.join('" or "')}"`
	}

	connectedCallback() {
		super.connectedCallback()
		// re-render every 2 minutes to change the "X minutes ago" label
		this.tickInterval = setInterval(this.onTick, 2 * 60 *1000)
	}

	disconnectedCallback() {
		super.disconnectedCallback()
		clearInterval(this.tickInterval)
	}

	onTick = () => this.requestUpdate()

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
		}

		:host,
		:host(.medium) {
			--aspect-ratio: 4 / 3;
			--flower-header-size: 1.125rem;
		}

		:host(.large) {
			--aspect-ratio: 16 / 9;
			--flower-header-size: 1.5rem;
			--flower-header-line-height: 2rem;
		}

		ha-card {
			background-size: cover;
			position: relative;
			overflow: hidden;
		}
		:host(.dragover) {
			opacity: 0.6;
		}

			#image {
				background-size: cover;
				background-position: center;
				aspect-ratio: var(--aspect-ratio);
				max-height: 320px;
				padding: 1rem;
				position: relative;
				display: flex;
				justify-content: space-between;
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

			#info {
				opacity: 0.8;
				grid-column: span 2;
				font-size: 12px;
				font-weight: 400;
				margin-top: -0.25rem;
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

	getImagePath(name, root, cacheBustHash) {
		if (!name) return undefined
		if (name.startsWith('.') || name.startsWith('/')) return name
		if (!root.endsWith('/')) root += '/'
		name = encodeURIComponent(name.toLowerCase())
		const filename = `${root}${name}.jpg`
		let url = filename
		if (cacheBustHash) url += `?cachebust=${sanitizeUrl(cacheBustHash)}`
		return url
	}

	get backgroundImage() {
		return [
			this.objectUrl,
			this.customImagePath,
			this.uploadImagePath,
			this.titleImagePath,
			this.nameImagePath,
			this.speciesImagePath,
		]
		.filter(a => a)
		.map(createCssUrl)
		.join(', ')
	}

	breakpoints = [200, 300]

	get sizeClass() {
		if (this.width < 200) return 'small'
		if (this.width < 300) return 'medium'
		return 'large'
	}

	get showLabels() {
		return this.width >= 200
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

	lastUploadDate = new Date()

	handleFiles = async files => {
		if (files.length === 0) return
		const [file] = Array.from(files)

		//http://localhost:3001/flower
		await api.post(`/flower/${this.entityIdSlug}`, file)
		this.lastUploadDate = Date.now()
		const resizedPhotoBlob = await fetch(this.uploadImagePath + `?random=${sanitizeUrl(this.lastUploadDate)}`).then(res => res.blob())
		this.objectUrl = URL.createObjectURL(resizedPhotoBlob)
		this.requestUpdate()
	}

	openPopup = (entityId, min, max, absMin, absMax) => {
		//this.emit('hass-more-info', {entityId})

		cardTools.popUp('Last 2 days', {
			type: 'custom:slick-flower-chart',
			entity: entityId,
			min,
			max,
			absMin,
			absMax
		})
	}

	renderCharts() {
		const {config, state, entity} = this
		const attrs = entity.attributes

		const [
			brightnessMin, brightnessMax,
			temperatureMin, temperatureMax,
			moistureMin, moistureMax,
			conductivityMin, conductivityMax,
		] = (this.dbEntry ?? []).slice(2)

		const temperatureCfg = config.temperature ?? config.temp
		const brightnessCfg = config.brightness ?? config.light
		const moistureCfg = config.moisture ?? config.water
		const conductivityCfg = config.conductivity ?? config.fertility ?? config.fert

		const chartData = [{
			unit: '°C',
			val: attrs.temperature ?? '?',
			min: temperatureCfg?.min ?? temperatureMin,
			max: temperatureCfg?.max ?? temperatureMax,
			icon: "mdi:thermometer-low",
			entityId: attrs.sensors.temperature,
			absMin: 0,
			absMax: 45,
		}, {
			unit: 'lx',
			val: attrs.brightness ?? '?',
			min: brightnessCfg?.min ?? brightnessMin,
			max: brightnessCfg?.max ?? brightnessMax,
			icon: "hass:white-balance-sunny",
			entityId: attrs.sensors.brightness,
		}, {
			unit: '%',
			val: attrs.moisture ?? '?',
			min: moistureCfg?.min ?? moistureMin,
			max: moistureCfg?.max ?? moistureMax,
			icon: "mdi:water-outline",
			entityId: attrs.sensors.moisture,
			absMin: 0,
			absMax: 100,
		}, {
			unit: 'µS/cm',
			val: attrs.conductivity ?? '?',
			min: conductivityCfg?.min ?? conductivityMin,
			max: conductivityCfg?.max ?? conductivityMax,
			icon: "mdi:emoticon-poop",
			entityId: attrs.sensors.conductivity,
		}]

		return chartData.map(({unit, val, min, max, icon, entityId, absMin, absMax}) => html`
			<slick-icon-chart icon="${icon}" .val="${val}" .min="${min}" .max="${max}"
			@click="${() => this.openPopup(entityId, min, max, absMin, absMax)}"
			title="${val} ${unit} | min ${min} ${unit} | max ${max} ${unit}">
				${this.showLabels ? `${val} ${unit}` : ''} 
			</slick-icon-chart>
		`)

		// TODO
		return html`
			${DEBUG ? html`
				<pre style="grid-column: span 2; white-space: pre-line; font-size: 12px">
					temperature:  ${attrs.temperature}  (min ${temperatureMin} max ${temperatureMax})
					brightness:   ${attrs.brightness}   (min ${brightnessMin} max ${brightnessMax})
					moisture:     ${attrs.moisture}     (min ${moistureMin} max ${moistureMax})
					conductivity: ${attrs.conductivity} (min ${conductivityMin} max ${conductivityMax})
				</pre>
			` : ''}
		`
	}

	render() {
		if (!this.entity?.attributes) return
		const {config, state, entity, error} = this
		const attrs = entity.attributes

		const title = config.title ?? config.name ?? config.species

		this.className = [
			this.sizeClass,
			this.isDraggingOver ? 'dragover' : ''
		].join(' ')

		const sysInfo = [
			entity.last_updated && timeSince(new Date(entity.last_updated)),
			(attrs.battery ?? '?') + '%',
		]
		.filter(a => a)
		.join(' ')

		if (this.error) return html`
			<ha-card style="padding: 1rem">
				<slick-card-title error>
					${this.errorMessage}
				</slick-card-title>
			</ha-card>
		`

		return html`
			<ha-card title="${`${sysInfo} ${entity.entity_id.slice(-6)}`}">
				<div id="image"
				style="background-image: ${this.backgroundImage}"
				@dragenter="${this.onDropEnter}"
				@dragover="${this.onDropEnter}"
				@dragleave="${this.onDropLeave}"
				@drop="${this.onDrop}">
					<span id="info" @click="${() => this.openPopup(attrs.sensors.battery)}">${sysInfo}</span>
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

/*
	fetchHistoryData(entityId) {
		const {sensors} = this.entity.attributes

		const entities = [
			sensors.brightness,
			sensors.conductivity,
			sensors.moisture,
			sensors.temperature,
		].join(',')

		const end = new Date
		const start = new Date(end - (1000 * 60 * 60 * 24 * 2))

		const history = await this.fetchHistory(start, end, entities)
	}
*/

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
		if (typeof val !== 'number' || Number.isNaN(val)) return
		if (val < 0 || val > 100) return 'red'
		if (val <= 15 || val >= 85) return 'orange'
		// another 'if' and not just 'else', to prevent having value for 'unavailable'
		if (val > 15 || val < 85) return 'green'
	}

	updated(map) {
		if (this.val === undefined || this.min === undefined || this.max === undefined) {
			// loading state should not have any color
			this.percentage = 0
			this.color = undefined
		} else {
			const shiftedVal = this.val - this.min
			const shiftedMax = this.max - this.min
			this.percentage = (shiftedVal / shiftedMax) * 100
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


class FlowerChart extends slickElement(history, hassData) {

	static entityType = 'sensor'

	static styles = css`
		:host,
		* {
			box-sizing: border-box;
		}
		:host {
			display: block;
			position: relative;
			padding: 1rem;
		}
	`

	setConfig(arg) {
		super.setConfig(arg)
		setTimeout(() => {
			// wait for defining this.hass
			this.historyDataReady = this.fetchHistoryData()
		})
	}

	async fetchHistoryData() {

		const end = new Date
		const start = new Date(end - (1000 * 60 * 60 * 24 * 2))

		const [entityData] = await this.fetchHistory(start, end, this.config.entity)
		this.historyData = entityData
		return this.historyData
	}

	connectedCallback() {
		super.connectedCallback()
		setTimeout(this.onConnectedTimeout)
	}

	onConnectedTimeout = async () => {
		//const canvas = document.createElement('canvas')
		const canvas = this.renderRoot.querySelector('canvas')
		//this.append(canvas)
		await this.historyDataReady
		this.renderHistoryChart(canvas, this.historyData)
	}

	renderHistoryChart(ctx, historyData) {
		const datapoints = historyData.map(h => ({
			x: +(new Date(h.last_changed)),
			y: Number(h.state),
		})).filter(o => !Number.isNaN(o.y))

		const values = datapoints.map(o => o.y)

		const {min, max, absMin, absMax} = this.config
		const gradientStops = calculateGradientStops(values, min, max, absMin, absMax)

		function createGradient(ctx, chartArea) {
			const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top)
			for (const [stop, color] of gradientStops)
				gradient.addColorStop(stop, color)
			return gradient
		}

		let width, height, gradient

		function getGradient(ctx, chartArea) {
			const chartWidth = chartArea.right - chartArea.left
			const chartHeight = chartArea.bottom - chartArea.top

			if (!gradient || width !== chartWidth || height !== chartHeight) {
				// Create the gradient because this is either the first render
				// or the size of the chart has changed
				width = chartWidth
				height = chartHeight
				gradient = createGradient(ctx, chartArea)
			}

			return gradient
		}

		const config = {
			type: 'line',
			data: {
				labels: datapoints.map(v => ''),
				datasets: [{
					data: datapoints,
					fill: false,
					radius: 0, // turns off points
					borderWidth: 2,
					cubicInterpolationMode: 'monotone',
					tension: 0.4,
					borderColor: context => {
						const {ctx, chartArea} = context.chart
						// This case happens on initial chart load
						if (!chartArea) return
						return getGradient(ctx, chartArea)
					},
				}]
			},
			options: {
				responsive: true,
				plugins: {
					legend: {
						display: false,
					},
				},
				interaction: {
					intersect: false,
				},
				scales: {
					x: {
						display: false,
						type: 'time',
						min: datapoints[0].x,
						max: datapoints[datapoints.length - 1].x,
					},
					y: {
						display: true,
						//min: 0,
						//max: 100,
						suggestedMin: this.config.absMin,
						suggestedMax: this.config.absMax
					}
				}
			},
		}

		const myChart = new Chart(ctx, config)
	}

	render() {
		return html`<canvas></canvas>`
		//return html`<ha-card><canvas></canvas></ha-card>`
	}
	//<canvas id="chart" width="200" height="100"></canvas>

}

const calculateGradientStops = (values, redValMin, redValMax, chartMin, chartMax) => {
	const valMin = Math.min(...values)
	const valMax = Math.max(...values)

	chartMin = chartMin ?? valMin
	chartMax = chartMax ?? valMax

	const [greenValMin, greenValMax] = calculateOrangeRange(redValMin, redValMax)

	const redRatioMin    = map(redValMin, chartMin, chartMax, 0, 1)
	const redRatioMax    = map(redValMax, chartMin, chartMax, 0, 1)
	const greenRatioMin  = map(greenValMin, chartMin, chartMax, 0, 1)
	const greenRatioMax  = map(greenValMax, chartMin, chartMax, 0, 1)
	const orangeRatioMin = redRatioMin + ((greenRatioMin - redRatioMin) / 2)
	const orangeRatioMax = redRatioMax + ((greenRatioMax - redRatioMax) / 2)

	let stops = [
		[redRatioMin, 'red'],
		[orangeRatioMin, 'orange'],
		[greenRatioMin, 'green'],
		[greenRatioMax, 'green'],
		[orangeRatioMax, 'orange'],
		[redRatioMax, 'red'],
	]

	stops = stops.filter(([stop]) => stop >= 0 && stop <= 1)

	if (stops.length === 0) {
		let avgValue = (valMin + valMax) / 2
		if (greenValMin <= avgValue && avgValue <= greenValMax)
			return [[0, 'green']]
		else
			return [[0, 'red']]
	}

	return stops
}

const orangeRangePercent = 15

const calculateOrangeRange = (min, max) => {
	const shiftedMax = max - min
	const scaledOrange = shiftedMax * (orangeRangePercent / 100)
	return [
		min + scaledOrange,
		max - scaledOrange,
	]
}

const map = (value, x1, y1, x2, y2) => (value - x1) * (y2 - x2) / (y1 - x1) + x2

const createCssUrl = path => {
	let separator = path.includes(`'`) ? `"` : `'`
	return `url(${separator}${path}${separator})`
}

const sanitizeUrl = arg => {
	arg = arg.getTime?.() ?? arg
	arg = arg.toString?.() ?? arg
	arg = encodeURIComponent(arg)
	return arg
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
customElements.define('slick-flower-chart', FlowerChart)
customElements.define('slick-flower-card', FlowerCard)