import {LitElement, html, css} from 'lit'
import {slickElement, hassData} from '../mixin/mixin.js'


const isDev = !window.hassConnection
console.log('~ isDev', isDev)
const imageLibPath = isDev ? 'http://localhost/flora-images/' : '/local/flora-images/'
const customUploadsPath = isDev ? './' : '/local/'

class FlowerCard extends slickElement(hassData) {

	static entityType = 'plant'

	getCardSize = () => 2

	setConfig(config) {
		super.setConfig(config)
        console.log('~ config', config)
		const [, entityId] = config.entity.split('.')
		this.customImagePath  = config.photo ?? config.image
		this.uploadImagePath  = this.getImagePath(entityId, customUploadsPath)
		this.nameImagePath    = this.getImagePath(config.name ?? config.title, imageLibPath)
		this.speciesImagePath = this.getImagePath(config.species, imageLibPath)
	}

	static styles = css`
		:host {
			display: block;
			user-select: none;
		}

		:host,
		:host([size="medium"]) {
			--flower-height: 240px;
			--flower-header-size: 1.5rem;
		}

		:host([size="small"]) {
			--flower-height: 160px;
			--flower-header-size: 1.25rem;
		}

		h2 {
			font-weight: 400;
			font-size: var(--flower-header-size);
		}

		#image {
			background-size: cover;
			background-position: center;
			width: 100%;
			height: var(--flower-height);
			position: relative;
		}
			#image h2 {
				position: absolute;
				bottom: 0;
				left: 0;
				right: 0;
				padding: 1rem;
				margin: 0;
				display: block;
				z-index: 0;
			}
			#image h2::after {
				content: '';
				position: absolute;
				inset: 0;
				background-color: var(--card-background-color);
				opacity: 0.8;
				z-index: -1;
			}

		#grid {
			display: grid;
			padding: 1rem;
			gap: 0.5rem 2rem;
			grid-template-columns: repeat(2, 1fr);
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
			this.customImagePath,
			this.uploadImagePath,
			this.nameImagePath,
			this.speciesImagePath,
		]
		.filter(a => a)
		.map(path => `url('${path}')`)
		.join(', ')
	}

	render() {
		const {config, state, entity} = this
		const attrs = entity?.attributes
		const units = entity?.attributes?.unit_of_measurement_dict

		const title = config.title ?? config.name ?? config.species
		//entity.friendly_name: "plant_c47c8d6da8d7"

		return html`
			<ha-card>
				<div id="image" style="background-image: ${this.backgroundImage}">
					<h2>${title}</h2>
				</div>
				<div id="grid">
					<slick-icon-chart title="${attrs?.brightness} ${units.brightness}"     icon="mdi:thermometer-low" value="100"></slick-icon-chart>
					<slick-icon-chart title="${attrs?.conductivity} ${units.conductivity}" icon="hass:white-balance-sunny" value="75"></slick-icon-chart>
					<slick-icon-chart title="${attrs?.moisture} ${units.moisture}"         icon="mdi:watering-can-outline" value="50"></slick-icon-chart>
					<slick-icon-chart title="${attrs?.temperature} ${units.temperature}"   icon="mdi:emoticon-poop" value="25"></slick-icon-chart>
				</div>
			</ha-card>
		`
		/*
		<br>friendly_name: ${attrs?.friendly_name}
		<br>battery: ${attrs?.battery} ${units.battery}
		*/
	}

	/*

	thermometer-low
	thermometer
	thermometer-high

	watering-can-outline
	watering-can

	emoticon-poop-outline
	emoticon-poop
	*/

}

class IconChart extends slickElement() {

	value = 0

	static properties = {
		value: {type: Number},
		icon: {type: String},
	}

	static styles = css`
		:host {
			display: flex;
			align-items: center;
		}
			ha-icon {
				margin-right: 0.5rem;
			}
			.bar {
				height: 10px;
				width: 100%;
				border-radius: 3px;
				background-color: rgba(128, 128, 128, 0.2);
				position: relative;
				overflow: hidden;
			}
				.indicator {
					width: 0%;
					height: 100%;
					background-color: rgba(128, 128, 128, 0.5);
				}
	`

	render() {
            console.log('~ this.icon', this.icon, this.value)
		return html`
			<ha-icon icon="${this.icon}"></ha-icon>
			<div class="bar" id="temp">
				<div class="indicator" style="width: ${this.value}%"></div>
			</div>
		`
	}

}


customElements.define('slick-icon-chart', IconChart)
customElements.define('slick-flower-card', FlowerCard)