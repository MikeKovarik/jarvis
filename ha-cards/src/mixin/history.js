export const history = Base => class extends Base {

	fetchHistory(...args) {
		const url = this.getHistoryUrl(...args)
        console.log('~ url', url)
		return this._hass.callApi('GET', url)
	}

	getHistoryUrl(start, end, entityId = this.entityId) {
		let url = 'history/period'
		if (start) url += `/${start.toISOString()}`
		url += `?filter_entity_id=${entityId}`
		if (end) url += `&end_time=${end.toISOString()}`
		url += '&significant_changes_only'
		url += '&minimal_response'
		url += '&no_attributes'
		return url
		//return this._hass.callApi('GET', url)
	}

}