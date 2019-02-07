import Message from 'util/message'
import Record from 'util/record'

import MapEntity from 'entity/map'
import Storage from 'entity/storage'
import Unit from 'entity/unit'
import Trade from 'entity/trade'

import Commander from 'command/commander'
import LoadCargo from 'command/loadCargo'
import MoveTo from 'command/moveTo'



const create = (transport, tradeCommanderParam = null, initialized = false, waitingForRoute = 0) => {
	const tradeCommander = tradeCommanderParam || Commander.create({ keep: true })

	const init = () => {
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
		if (Commander.isIdle(tradeCommander) && !tradeRoute.pleaseStop && currentTime > waitingForRoute) {
			const route = Trade.match(transport)
			if (route) {
				Commander.scheduleBehind(tradeCommander, MoveTo.create(transport, route.from.mapCoordinates))
				Commander.scheduleBehind(tradeCommander, LoadCargo.create(route.from, transport, { good: route.good, amount: route.amount }))
				Commander.scheduleBehind(tradeCommander, MoveTo.create(transport, route.to.mapCoordinates))
				Commander.scheduleBehind(tradeCommander, LoadCargo.create(route.to, transport, { good: route.good, amount: -route.amount }))
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
		type: 'tradeRoute',
		waitingForRoute,
		initialized,
		tradeCommander: tradeCommander.save(),
		transport: Record.reference(transport)
	})

	const tradeRoute = {
		commands: tradeCommander.commands,
		init,
		update,
		save
	}

	return tradeRoute
}

const load = data => {
	const transport = Record.dereference(data.transport)
	const tradeRoute = create(transport, Commander.load(data.tradeCommander), data.initialized, data.waitingForRoute)

	return tradeRoute
}

export default { create, load }