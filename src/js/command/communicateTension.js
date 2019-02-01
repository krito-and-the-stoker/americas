import Util from 'util/util'
import Record from 'util/record'

import Dialog from 'view/ui/dialog'

import Storage from 'entity/storage'
import Settlement from 'entity/settlement'


const create = (colony, settlement, unit) => {
	const goods = ['food', 'sugar', 'tobacco', 'furs', 'cotton', 'ore', 'coats', 'cloth']

	const init = () => {
		if (settlement.tension < 5) {
			const good = Util.choose(goods)
			const amount = 2 + Math.round(Math.random() * 15)

			Dialog.create({
				text: `As a sign of our friendship and peace take these ${amount} ${good} as a gift.`,
				type: 'natives',
				image: settlement.tribe.image,
				coords: colony.mapCoordinates,
				options: [{
					text: 'Thank you!',
					default: true,
					action: () => Storage.update(colony.storage, { good, amount })
				}]
			})

			Settlement.update.tension(settlement, settlement.tension / 2)

			return false
		}

		if (settlement.tension < 20) {
			Dialog.create({
				text: 'Although we are glad to see your colonies prosper, we are concerned with your overuse of land.',
				type: 'natives',
				image: settlement.tribe.image,
				coords: colony.mapCoordinates,
				options: [{
					text: 'Good to know.'
				}]
			})

			Settlement.update.tension(settlement, settlement.tension / 2)

			return false
		}

		Dialog.create({
			text: 'We cannot tolerate your careless exploitation of our ancestors land any longer.',
			type: 'natives',
			image: settlement.tribe.image,
			coords: colony.mapCoordinates,
			options: [{
				text: 'Is that so?'
			}]
		})

		return false		
	}

	const save = () => ({
		type: 'communicateTension',
		colony: Record.reference(colony),
		settlement: Record.reference(settlement),
		unit: Record.reference(unit),
	})

	return {
		init,
		save
	}
}

const load = data => create(Record.dereference(data.colony), Record.dereference(data.settlement), Record.dereference(data.unit))

export default { create, load }