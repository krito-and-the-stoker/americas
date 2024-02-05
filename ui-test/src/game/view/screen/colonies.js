import Goods from 'data/goods'

import Time from 'timeline/time'

import Util from 'util/util'
import Record from 'util/record'

import GoodsView from 'view/goods'

import Dom from 'render/dom'

let el
let destroy
let isNowOpen = false
let currentMode = 'Storage'
const render = () => {
	const { h, patch } = Dom
	el = el || document.querySelector('.screen')

	const storage = (colony, good) => Math.round(colony.storage[good])
	const production = (colony, good) => Math.round(colony.productionSummary[good])
	const display = currentMode === 'Storage' ? storage : production

	const allColonies = Record.getAll('colony')

	const max = Util.max(Util.flatten(allColonies.map(colony => Goods.types.map(good => display(colony, good)))))
	const min = Util.min(Util.flatten(allColonies.map(colony => Goods.types.map(good => display(colony, good)))))
	const color = number => {
		if (number === 0) {
			return 'transparent'
		}

		const fraction = Util.clamp(Math.pow(
			number > 0
				? number / max
				: number / min,
			0.5
		))

		if (number > 0) {
			return `rgb(0,${200*fraction},0)`
		}

		return `rgb(${200*fraction},0,0)`
	}

	const goods =  Goods.types.map(name => GoodsView.html(name))
	const colonies = allColonies.map(colony => {
		return h('div', [
				h('span.name', `${colony.name} (${colony.colonists.length})`),
				...Goods.types.map(good => h(
					'span.storage',
					{
						style: {
							color: color(display(colony, good))
						}
					},
					display(colony, good)
				)),
			])
	})
	const sum = h('div.total', [
		h('span.name', `Colonial Empire (${Util.sum(allColonies.map(colony => colony.colonists.length))})`),
		...Goods.types.map(good => h(
			'span.storage',
			{
				style: {
					color: color(Util.sum(allColonies.map(colony => display(colony, good))))
				}
			},
			Util.sum(allColonies.map(colony => display(colony, good)))
		))
	])

	if (isNowOpen) {	
		el = patch(el, h('div.screen', [
			h('div.colony', [
				h('div.close', { on: { click: close } }, 'Close'),
				h('div.inner', [
					h('button.mode', {
						on: {
							click: () => {
								if (currentMode === 'Storage') {
									currentMode = 'Production'
								} else {
									currentMode = 'Storage'
								}
								render()
							}
						}
					}, currentMode),
					h('div.goods', goods),
					h('div.colonies', colonies),
					h('div.sum', sum)
				])
			])
		]))
	} else {
		el = patch(el, h('div.screen'))
	}

	return isNowOpen
}

const create = () => {
	render()
	return Time.schedule({
		update: render,
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
		render()
		destroy = null
	}
}

const isOpen = () => isNowOpen

export default {
	open,
	close,
	isOpen
}