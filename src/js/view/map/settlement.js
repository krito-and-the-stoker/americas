import Goods from 'data/goods'
import Units from 'data/units'

import Util from 'util/util'
import Record from 'util/record'

import Click from 'input/click'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'
import Settlement from 'entity/settlement'
import Owner from 'entity/owner'

import Natives from 'ai/natives'

import Resources from 'render/resources'
import Foreground from 'render/foreground'

import Dialog from 'view/ui/dialog'


const TILE_SIZE = 64

const create = settlement => {
	const tile = MapEntity.tile(settlement.mapCoordinates)
	const unsubscribe = Tile.listen.discovered(tile, discovered => {
		if (discovered) {
			const sprite = Resources.sprite('map', { frame: settlement.tribe.id - 1 })
			sprite.x = TILE_SIZE * settlement.mapCoordinates.x
			sprite.y = TILE_SIZE * settlement.mapCoordinates.y

			const unsubscribeClick = Click.on(sprite, () => {
				const player = Owner.player()
				const relations = settlement.owner.ai.state.relations[player.referenceId]
				const relation = relations ? Natives.describeRelations(relations) : null
				const tribe = settlement.tribe.name
				const expertName = Units.settler.name[settlement.expert]
				const knowledge = settlement.presentGiven ?
					`This settlement has the knowledge to train a **${expertName}**.` : 'We have *not visited* this village yet.'
				const text = relation ? `The ${tribe} seem ${relation} at the moment.\n\n${knowledge}` : knowledge
				Dialog.create({
					type: 'scout',
					text
				})
			}, `Inspect ${settlement.tribe.name} settlement`)
			Foreground.addTerrain(sprite)

			const unsubscribeMission = Settlement.listen.mission(settlement, mission => {
				if (mission) {
					const missionSymbol = Resources.sprite('map', { frame: Goods.crosses.id })
					missionSymbol.x = sprite.x + 16
					missionSymbol.y = sprite.y + 16
					missionSymbol.scale.set(0.5)
					Foreground.addTerrain(missionSymbol)

					return () => Foreground.removeTerrain(missionSymbol)
				}
			})

			return [
				() => Foreground.removeTerrain(sprite),
				unsubscribeMission,
				unsubscribeClick
			]
		}
	})

	return {
		unsubscribe,
	}
}

const destroy = view => {
	Util.execute(view.unsubscribe)
}

const initialize = () => {
	Record.listen('settlement', settlement => {
		const view = create(settlement)

		return () => {
			destroy(view)
		}
	})
}

export default { initialize }