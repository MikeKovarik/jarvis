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

		:host([size="small"]) {
			--flower-height: 240px;
			--flower-header-size: 1.125rem;
		}

		:host,
		:host([size="medium"]) {
			--flower-height: 280px;
			--flower-header-size: 1.25rem;
		}

		:host([size="large"]) {
			--flower-height: 360px;
			--flower-header-size: 1.5rem;
		}

		ha-card {
			background-size: cover;
			background-position: center;
			height: var(--flower-height);
			position: relative;
		}

			#wrapper {
				position: absolute;
				right: 0;
				left: 0;
				bottom: 0;
				z-index: 1;
			}
			#wrapper::after {
				content: '';
				position: absolute;
				inset: 0;
				background-color: var(--card-background-color);
				opacity: 0.9;
				z-index: -1;
			}

			h2 {
				margin: 0;
				padding: 1.25rem 1rem 0rem 1rem;
				display: block;
				text-transform: capitalize;
				font-weight: 400;
				font-size: var(--flower-header-size);
				white-space: nowrap;
				overflow: hidden;
				text-overflow: ellipsis;
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
			<ha-card style="background-image: ${this.backgroundImage}">
				<div id="wrapper">
					<h2>${title}</h2>
					<div id="grid">
						<slick-icon-chart title="${attrs?.brightness} ${units.brightness}"     icon="mdi:thermometer-low" value="100"></slick-icon-chart>
						<slick-icon-chart title="${attrs?.conductivity} ${units.conductivity}" icon="hass:white-balance-sunny" value="75"></slick-icon-chart>
						<slick-icon-chart title="${attrs?.moisture} ${units.moisture}"         icon="mdi:water-outline" value="50"></slick-icon-chart>
						<slick-icon-chart title="${attrs?.temperature} ${units.temperature}"   icon="mdi:emoticon-poop" value="25"></slick-icon-chart>
					</div>
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
			--color: rgb(128, 128, 128);
		}
		:host([color="red"]) {
			--color: rgb(255, 48, 58);
		}
		:host([color="orange"]) {
			--color: rgb(175, 120, 0);
		}
		:host([color="green"]) {
			--color: rgb(105, 200, 10);
		}

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
					background-color: var(--color);
					opacity: 0.5;
				}
	`

	render() {
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