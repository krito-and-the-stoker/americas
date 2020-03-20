import Util from 'util/util'
import Record from 'util/record'

import Unit from 'entity/unit'
import Europe from 'entity/europe'
import Storage from 'entity/storage'

import Dom from 'render/dom'

import UnitView from 'view/unit'
import UnitMapView from 'view/map/unit'
import GoodsView from 'view/goods'

let el
let destroy
let isNowOpen = false
const render = () => {
	const { h, patch } = Dom
	el = el || document.querySelector('.screen')

	const place = unit => {
		if (Europe.has.unit(unit)) {
			return 'London'
		}

		if (unit.colony) {
			return unit.colony.name
		}

		if (unit.tile) {
			if (unit.tile.settlement) {
				const tribe = unit.tile.settlement
				return `${tribe.name} settlement`
			}

			if (unit.tile.forest) {
				return 'forest'
			} else if (unit.tile.mountains) {
				return 'mountains'
			} else if (unit.tile.hills) {
				return 'hills'
			} else {
				return 'planes'
			}
		}

		return 'Americas'
	}

	const CARGO_SCALE = 0.5
	const PASSENGER_SCALE = 0.7
	const goods = unit => Storage.goods(unit.storage)
		.filter(pack => pack.amount > 0)
		.map(pack => GoodsView.html(pack.good, CARGO_SCALE))
	const passengers = unit => unit.passengers.map(passenger => UnitView.html(passenger, PASSENGER_SCALE))

	const select = unit => {
		close()
		UnitMapView.select(unit)
	}

	if (isNowOpen) {
		const units = Record.getAll('unit')
			// exclude colonists (they technically are still attached to a unit)
			.filter(unit => !(unit.colonist && unit.colonist.colony))
			// exclude passengers
			.filter(unit => !unit.vehicle)
			.map(unit =>
				h('div.unit', [
					UnitView.html(unit, 1, {
						on: {
							click: () => select(unit)
						}
					}),
					h('div.text', [
						h('div.name', Unit.name(unit)),
						h('div.command', unit.command && unit.command.display),
						h('div.place', place(unit)),
					]),
					h('div.cargo', [
						h('div.goods', goods(unit)),
						h('div.passengers', passengers(unit))
					])
				]))


		el = patch(el, h('div.screen', [
			h('div.units', units)
		]))
	} else {
		el = patch(el, h('div.screen'))
	}
}

const create = () => {
	return Record.listen('unit', unit => {
		if (!(unit.colonist && unit.colonist.colony)) {
			render()
			return render
		}
	})
}

const open = () => {
	if (!isNowOpen) {	
		isNowOpen = true
		destroy = create()
	}
}

const close = () => {
	if (isNowOpen) {	
		isNowOpen = false
		Util.execute(destroy)
		destroy = null
	}
}

const isOpen = () => isNowOpen

export default {
	open,
	close,
	isOpen
}