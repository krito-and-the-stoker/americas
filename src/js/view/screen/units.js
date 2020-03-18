import Util from 'util/util'
import Record from 'util/record'

import Unit from 'entity/unit'
import Europe from 'entity/europe'

import Dom from 'render/dom'

import UnitView from 'view/unit'

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

	if (isNowOpen) {
		const units = Record.getAll('unit')
			.filter(unit => !(unit.colonist && unit.colonist.colony))
			.map(unit =>
				h('div', [
					UnitView.html(unit),
					h('span.name', Unit.name(unit)),
					h('span.command', unit.command && unit.command.display),
					h('span.place', place(unit))
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
	console.log('opening')
	if (!isNowOpen) {	
		isNowOpen = true
		destroy = create()
	}
}

const close = () => {
	console.log('closing')
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