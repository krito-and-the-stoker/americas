import 'test/min-setup'

import Util from 'util/util'
import Time from 'timeline/time'

import Unit from 'entity/unit'
import Colony from 'entity/colony'

import Command from 'command'


const advance = (n = 1) => Util.range(n).forEach(() => Time.advance(500))
const load = data => Command[data.module].load(data)

const commandTest = (name, create) => {
	test(`${name}: save & load`, () => {
		const command = create()
		const save1 = command.save()
		const revived = load(save1)
		const save2 = revived.save()
		const revived2 = load(save2)
		const save3 = revived2.save()

		expect(save1).toEqual(save2)
		expect(save1).toEqual(save3)
	})

	test(`${name}: save & advance`, () => {
		const command = create()
		advance(3)
		const save1 = command.save()
		advance(12)
		const laterSave1 = command.save()

		const revive = load(save1)
		advance(12)
		const laterSave2 = revive.save()

		expect(laterSave1).toEqual(laterSave2)
	})

	test(`${name}: advance`, () => {
		create()
		create()

		advance(200)
	})
}

const ship = () => Unit.create('caravel', {x: 0, y: 5})
const pioneer = () => Unit.create('pioneer', {x: 1, y: 2 })
const settler = () => Unit.create('settler', {x: 1, y: 2 })
const jamestown = () => Colony.create({ x:1, y:1 })
const tools = () => ({ good: 'tools', amount: 79 })
const closePlace = () => ({ x: 2, y: 2 })
const place = () => ({ x: 3, y: 4 })
const immigration = () => ({ unit: settler() })


const commands = {
	america: () => {
		const unit = ship()
		return Command.America.create({ unit })
	},
	// commander: () => {
	// 	return Commander.create()
	// },
	cutForest: () => {
		const unit = pioneer()
		return Command.CutForest.create({ unit })
	},
	disband: () => {
		const unit = pioneer()
		return Command.Disband.create({ unit })
	},
	europe: () => {
		const unit = ship()
		Unit.update.offTheMap(true)
		return Command.Europe.create({ unit })
	},
	found: () => {
		const unit = pioneer()
		return Command.Found.create({ unit })
	},
	goTo: () => {
		const unit = ship()
		const colony = jamestown()
		return Command.GoTo.create({ unit, colony })
	},
	learnFromNatives: () => {
		const unit = settler()
		return Command.LearnFromNatives.create({ unit, profession: 'farmer' })
	},
	load: () => {
		const transport = ship()
		const passenger = pioneer()
		return Command.LoadUnit.create({ transport, passenger })
	},
	loadCargo: () => {
		const colony = jamestown()
		const unit = pioneer()
		const good = tools()
		return Command.LoadCargo.create(colony, unit, good)
	},
	move: () => {
		const unit = pioneer()
		const coords = closePlace()
		return Command.Move.create(unit, coords)
	},
	moveTo: () => {
		const unit = pioneer()
		const coords = place()
		return Command.MoveTo.create({ unit, coords })
	},
	plow: () => {
		const unit = pioneer()
		return Command.Plow.create(unit)
	},
	road: () => {
		const unit = pioneer()
		return Command.Road.create(unit)
	},
	tradeCargo: () => {
		const colony = jamestown()
		const unit = Unit.create('caravel', colony.mapCoordinates)
		const pack = tools()
		return Command.TradeCargo.create(colony, unit, pack)
	},
	tradeRoute: () => {
		const unit = ship()
		return Command.TradeRoute.create(unit)
	},
	triggerEvent: () => {
		const notification = immigration()
		return Command.TriggerEvent.create('notification', notification)
	}
}

const run = () => {
	Object.entries(commands).forEach(([name, create]) => commandTest(name, create))
}

run()