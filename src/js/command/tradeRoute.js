import Util from 'util/util'
import Message from 'util/message'
import Events from 'util/events'

import MapEntity from 'entity/map'
import Storage from 'entity/storage'
import Unit from 'entity/unit'
import Trade from 'entity/trade'
import Europe from 'entity/europe'
import Forecast from 'entity/forecast'

import Factory from 'command/factory'
import Commander from 'command/commander'
import GoTo from 'command/goTo'
import LoadCargo from 'command/loadCargo'
import TradeCargo from 'command/tradeCargo'
import TriggerEvent from 'command/triggerEvent'

const scheduleRoute = (state, route) => {
	const { commander, unit } = state
	const goods = route.orders.reduce((s, order) => s ? `${s}, ${order.amount} ${order.good}` : `${order.amount} ${order.good}`, null)
	Message.send(`A ${unit.name} will bring ${goods} from ${route.src.name} to ${route.dest.name}`)
	Factory.update.display(state, `Transporting ${goods} from ${route.src.name} to ${route.dest.name}`)

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
}

const findAlternativeRoute = (state, route, routes) => {
	const { unit } = state
	let src = null
	if (Europe.has.unit(unit)) {
		src = {
			isEurope: true,
			type: 'europe'
		}
	} else if (unit.colony) {
		src = unit.colony
	}

	if (!src) {
		return null
	}

	const dest = route.src
	const compare = (src1, src2) =>
		((src1.type === 'europe' && src2.type === 'europe')
			|| (src1.type === 'colony' && src2.type === 'colony' && src1 === src2))

	return routes.find(route => compare(route.src, src) && compare(route.dest, dest))
}

const reserveGoods = state => {
	if (state.forecastColony) {
		state.forecasts.forEach(pack => Forecast.add(state.forecastColony, pack))
	}
}

const unreserveGoods = state => {
	if (state.forecastColony) {
		state.forecasts.forEach(pack => Forecast.remove(state.forecastColony, pack))
		state.forecastColony = null
		state.forecasts = []
	}
}

export default Factory.commander('TradeRoute', {
	unit: {
		type: 'entity',
		required: true
	},
	needsOrders: {
		type: 'raw',
		default: true
	},
	forecasts: {
		type: 'raw',
		default: []
	},
	forecastColony: {
		type: 'entity'
	}
}, {
	id: 'tradeRoute',
	display: 'Transporting goods',
	icon: 'tradeRoute'
}, state => {
	let tradeRouteActive = true
	const { unit, commander } = state
	reserveGoods(state)
	const unsubscribeEvents = Events.listen('trade-route-complete', params => {
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

			// remove all forecasts
			unreserveGoods(state)

			const { route, routes } = Trade.match(unit)
			if (route) {
				// already there
				if ((unit.colony === route.src) || (route.src.type === 'europe' && Europe.has.unit(unit))) {
					scheduleRoute(state, route)
				} else {
					const subRoute = findAlternativeRoute(state, route, routes)
					if (subRoute) {
						scheduleRoute(state, subRoute)
					} else {
						// go to route src first
						Message.log(`A ${unit.name} is moving to ${route.src.name} for next transport`)
						Factory.update.display(state, `Moving to ${route.src.name} for next transport`)

						// reserve goods
						state.forecastColony = route.src
						route.orders.forEach(order => {
							const pack = { good: order.good, amount: order.amount }
							state.forecasts.push(pack)
						})
						reserveGoods(state)

						Commander.scheduleInstead(commander, GoTo.create({
							unit,
							colony: route.src.type === 'colony' ? route.src : null,
							europe: route.src.type === 'europe'
						}))
					}
				}
				Commander.scheduleBehind(commander, TriggerEvent.create({ name: 'trade-route-complete', id: commander.tag }))
			} else {
				Message.send(`A ${unit.name} has not found any routes and will look again shortly`)
				Factory.update.display(state, 'Waiting for transport routes')
				Commander.scheduleBehind(commander, TriggerEvent.create({ name: 'trade-route-complete', id: commander.tag, wait: 2500 }))
			}
		}

		return tradeRouteActive
	}

	const cancel = () => {
		Commander.clearSchedule(commander)
		tradeRouteActive = false
	}

	const cleanup = () => {
		Util.execute(unsubscribeEvents)
		unreserveGoods(state)
	}

	return {
		update,
		cancel,
		finished: cleanup,
		canceled: cleanup
	}
})
