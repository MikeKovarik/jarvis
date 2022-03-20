import {css} from 'lit'


export const hassData = Base => class extends Base {

	async setConfig(config) {
		if (!config.entity)
			throw new Error('You need to define an entity')
		if (!config.entity?.startsWith(`${this.constructor.entityType}.`))
			throw new Error(`only supported entity is ${this.constructor.entityType}.*`)
		this.baseId = config.entity.split('.')[1]
		this.config = config
	}

	static styles = css`
		ha-card {
			padding: 1rem;
		}
		.slider {
			padding: 0.5rem 1rem;
			background-color: rgba(var(--color), 0.1);
			border-radius: 0.5rem;
		}
		.rpm {
			color: rgba(var(--color), 1);
		}
		.key-val strong {
			font-weight: 500;
			opacity: 1;
		}
		.key-val span {
			font-weight: 400;
			opacity: 0.6;
		}
	`

	state = {}

	get entity() {
		const {entityType} = this.constructor
		return this.state[entityType]
	}

	get entity_id() {
		return this.entity.entity_id
	}

	set hass(hass) {
		this._hass = hass
		const {states} = hass
		const {state, config} = this
		const {entityType} = this.constructor
		const entityNameStub = `.${this.baseId}_`
		const updatedProps = new Set
		if (state[entityType] !== states[config.entity])
			updatedProps.add(entityType)
		state[entityType] = states[config.entity]
		for (const [key, entity] of Object.entries(states)) {
			const index = key.indexOf(entityNameStub)
			if (index === -1) continue
			const prop = key.slice(index + entityNameStub.length)
			if (state[prop] === entity) continue
			updatedProps.add(prop)
			state[prop] = entity
		}
		if (updatedProps.size) {
			this.requestUpdate()
			this.onStateUpdate?.(updatedProps)
		}
	}

	getCardSize = () => 3

}