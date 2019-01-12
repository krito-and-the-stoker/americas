import * as PIXI from 'pixi.js'

import Storage from '../../entity/storage'
import ProductionView from '../production'


const create = colony => {
	const container = new PIXI.Container()

	const totalWidth = 550

	container.position.y = 710
	container.position.x = 10
	const unsubscribe = Storage.listen(colony.productionSummary, summary => {
		const packs = Storage.productions(summary).concat(Storage.goods(summary))
			.filter(({ amount }) => amount !== 0)
			.sort((a, b) => b.amount - a.amount)
		const width = totalWidth / packs.length
		const views = packs.map(pack => ProductionView.create(pack.good, pack.amount, width))

		views.forEach((view, index) => {
			view.forEach(s => {
				s.x += index * width
				container.addChild(s)
			})
		})

		return () => {
			views.flat().forEach(s => container.removeChild(s))
		}
	})

	return {
		unsubscribe,
		container
	}
}

export default { create }