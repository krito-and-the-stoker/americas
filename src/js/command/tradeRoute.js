import Message from 'util/message'
import Events from 'util/events'

import MapEntity from 'entity/map'
import Storage from 'entity/storage'
import Unit from 'entity/unit'
import Trade from 'entity/trade'

import Factory from 'command/factory'
import Commander from 'command/commander'
import GoTo from 'command/goTo'
import LoadCargo from 'command/loadCargo'
import TradeCargo from 'command/tradeCargo'
import TriggerEvent from 'command/triggerEvent'


export default Factory.commander('TradeRoute', {
	unit: {
		type: 'entity',
		required: true
	},
	needsOrders: {
		type: 'raw',
		default: true
	}
}, state => {
	const { unit, commander } = state
	const unsubscribe = Events.listen('trade-route-complete', params => {
		if (params.id === commander.tag) {
			state.needsOrders = true
		}
	})

	const update = () => {
		if (state.needsOrders) {
			state.needsOrders = false
			if (Storage.split(unit.storage).length > 0) {
				return false
			}

			if (!unit.properties.cargo) {
				return false
			}

			// try unloading all passengers
			if (unit.passengers.length > 0) {
				if (MapEntity.tile(unit.mapCoordinates).domain === 'land') {
					Unit.unloadAllUnits(unit)
				} else {
					return false
				}
			}

			const route = Trade.match(unit)
			if (route) {
				const goods = route.orders.reduce((s, order) => s ? `${s}, ${order.amount} ${order.good}` : `${order.amount} ${order.good}`, null)
				Message.send(`A ${unit.name} will bring ${goods} from ${route.src.name} to ${route.dest.name}`)

				Commander.scheduleInstead(commander, GoTo.create({
					unit,
					colony: route.src.type === 'colony' ? route.src : null,
					europe: route.src.type === 'europe'
				}))

				route.orders.forEach(order => {
					const pack = { good: order.good, amount: order.amount }
					if (route.src.isEurope) {
						Commander.scheduleBehind(commander, TradeCargo.create({ unit, pack }))
					} else {
						Commander.scheduleBehind(commander, LoadCargo.create({ colony: route.src, unit, pack }))
					}
				})

				Commander.scheduleBehind(commander, GoTo.create({
					unit,
					colony: route.dest.type === 'colony' ? route.dest : null,
					europe: route.dest.type === 'europe'
				}))

				route.orders.forEach(order => {
					const pack = { good: order.good, amount: -order.amount }
					if (route.dest.isEurope) {
						Commander.scheduleBehind(commander, TradeCargo.create({ unit, pack }))
					} else {
						Commander.scheduleBehind(commander, LoadCargo.create({ colony: route.dest, unit, pack }))
					}
				})

				Commander.scheduleBehind(commander, TriggerEvent.create({ name: 'trade-route-complete', id: commander.tag }))
			} else {
				Message.send(`A ${unit.name} has not found any routes and will look again shortly`)
				Commander.scheduleBehind(commander, TriggerEvent.create({ name: 'trade-route-complete', id: commander.tag, wait: 2500 }))
			}
		}

		return true
	}

	return {
		update,
		finished: unsubscribe,
		canceled: unsubscribe
	}
})
