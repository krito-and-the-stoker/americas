import Message from 'util/message'
import Record from 'util/record'
import Events from 'util/events'
import Decorators from 'util/decorators'

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
}, ({ unit, needsOrders, commander }) => {
	let waitingForRoute = 0

	const update = currentTime => {
		if (needsOrders && currentTime > waitingForRoute) {
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
				Message.send(`A ${unit.name} will unit ${goods} from ${route.src.name} to ${route.dest.name}`)

				Commander.scheduleInstead(commander, GoTo.create({
					unit,
					colony: route.src.type === 'colony' && route.src,
					europe: route.src.type === 'europe'
				}))

				route.orders.forEach(order => {
					if (route.src.isEurope) {
						const pack = { good: order.good, amount: order.amount }
						Commander.scheduleBehind(commander, TradeCargo.create({ unit, pack }))
					} else {
						Commander.scheduleBehind(commander, LoadCargo.create(route.src, unit, { good: order.good, amount: order.amount }))
					}
				})

				Commander.scheduleInstead(commander, GoTo.create({
					unit,
					colony: route.dest.type === 'colony' && route.dest,
					europe: route.dest.type === 'europe'
				}))

				route.orders.forEach(order => {
					if (route.dest.isEurope) {
						const pack = { good: order.good, amount: -order.amount }
						Commander.scheduleBehind(commander, TradeCargo.create({ unit, pack }))
					} else {
						Commander.scheduleBehind(commander, LoadCargo.create(route.dest, unit, { good: order.good, amount: -order.amount }))
					}
				})

				// make sure we generate new orders eventually
				needsOrders = false
				Commander.scheduleBehind(commander, TriggerEvent.create({ name: 'trade-route-complete', unit }))
				const unsubscribeListener = Events.listen('trade-route-complete', ({ unit }) => {
					if (unit === unit) {
						needsOrders = true
						unsubscribeListener()
					}
				})
			} else {
				Message.send(`A ${unit.name} has not found any routes and will look again shortly`)
				waitingForRoute = currentTime + 2500
			}
		}

		return true
	}

	return {
		update
	}
})
