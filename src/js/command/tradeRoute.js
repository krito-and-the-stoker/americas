import Message from 'util/message'
import Record from 'util/record'
import Events from 'util/events'
import Decorators from 'util/decorators'

import MapEntity from 'entity/map'
import Storage from 'entity/storage'
import Unit from 'entity/unit'
import Trade from 'entity/trade'

import Commander from 'command/commander'
import GoTo from 'command/goTo'
import LoadCargo from 'command/loadCargo'
import TradeCargo from 'command/tradeCargo'
import TriggerEvent from 'command/triggerEvent'


const create = Decorators.ensureArguments(1, (transport, tradeCommanderParam = null, initialized = false, waitingForRoute = 0, needsOrders = true) => {
	const tradeCommander = tradeCommanderParam || Commander.create({ keep: true })

	if (!needsOrders) {
		const unsubscribeListener = Events.listen('trade-route-complete', ({ unit }) => {
			if (unit === transport) {
				needsOrders = true
				unsubscribeListener()
			}
		})		
	}

	const init = () => {
		console.log('trade route initialized')
		if (initialized) {
			return true
		}
		initialized = true

		// cannot start trade route when loaded
		if (Storage.split(transport.storage).length > 0) {
			return false
		}

		if (!transport.properties.cargo) {
			return false
		}

		// try unloading all passengers
		if (transport.passengers.length > 0) {
			if (MapEntity.tile(transport.mapCoordinates).domain === 'land') {
				Unit.unloadAllUnits(transport)
				return true
			}
			return false
		}

		return true
	}

	const update = currentTime => {
		if (needsOrders && !tradeRoute.pleaseStop && currentTime > waitingForRoute) {
			const route = Trade.match(transport)
			if (route) {
				const goods = route.orders.reduce((s, order) => s ? `${s}, ${order.amount} ${order.good}` : `${order.amount} ${order.good}`, null)
				Message.send(`A ${transport.name} will transport ${goods} from ${route.src.name} to ${route.dest.name}`)

				Commander.scheduleInstead(tradeCommander, GoTo.create({
					unit: transport,
					colony: route.src.type === 'colony' && route.src,
					europe: route.src.type === 'europe'
				}))

				route.orders.forEach(order => {
					if (route.src.isEurope) {
						const pack = { good: order.good, amount: order.amount }
						Commander.scheduleBehind(tradeCommander, TradeCargo.create({ unit: transport, pack }))
					} else {
						Commander.scheduleBehind(tradeCommander, LoadCargo.create(route.src, transport, { good: order.good, amount: order.amount }))
					}
				})

				Commander.scheduleInstead(tradeCommander, GoTo.create({
					unit: transport,
					colony: route.dest.type === 'colony' && route.dest,
					europe: route.dest.type === 'europe'
				}))

				route.orders.forEach(order => {
					if (route.dest.isEurope) {
						const pack = { good: order.good, amount: -order.amount }
						Commander.scheduleBehind(tradeCommander, TradeCargo.create({ unit: transport, pack }))
					} else {
						Commander.scheduleBehind(tradeCommander, LoadCargo.create(route.dest, transport, { good: order.good, amount: -order.amount }))
					}
				})

				// make sure we generate new orders eventually
				needsOrders = false
				Commander.scheduleBehind(tradeCommander, TriggerEvent.create('trade-route-complete', { unit: transport }))
				const unsubscribeListener = Events.listen('trade-route-complete', ({ unit }) => {
					if (unit === transport) {
						needsOrders = true
						unsubscribeListener()
					}
				})
			} else {
				Message.send(`A ${transport.name} has not found any routes and will look again shortly`)
				waitingForRoute = currentTime + 2500
			}
		}

		if (tradeRoute.pleaseStop) {
			Commander.clearSchedule(tradeCommander)
			tradeCommander.update()
			return !Commander.isIdle(tradeCommander)
		}

		return tradeCommander.update()
	}

	const save = () => ({
		module: 'TradeRoute',
		waitingForRoute,
		initialized,
		tradeCommander: tradeCommander.save(),
		transport: Record.reference(transport),
		needsOrders
	})

	const tradeRoute = {
		commands: tradeCommander.commands,
		init,
		update,
		save
	}

	return tradeRoute
})

const load = data => {
	const transport = Record.dereference(data.transport)
	const tradeRoute = create(transport, Commander.load(data.tradeCommander), data.initialized, data.waitingForRoute, data.needsOrders)

	return tradeRoute
}

export default { create, load }