import Events from 'util/events'


export default (settlement, unit) => {
	Events.trigger('notification', { type: 'settlement', settlement, unit })
}