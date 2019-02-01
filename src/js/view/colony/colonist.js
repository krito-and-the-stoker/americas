import * as PIXI from 'pixi.js'

import Units from 'data/units.json'
import Util from 'util/util'
import Resources from 'render/resources'
import Click from 'input/click'
import Drag from 'input/drag'
import Tile from 'entity/tile'
import Context from 'view/ui/context'
import Colonist from 'entity/colonist'


const frames = Units.settler.frame

const create = colonist => {
	const frame = colonist.expert ? frames[colonist.expert] || frames.default : frames.default
	const sprite = Resources.sprite('map', { frame })
	sprite.hitArea = new PIXI.Rectangle(16, 0, 32, 64)

	Click.on(sprite, async () => {
		if (colonist.work && colonist.work.type === 'Field') {
			const tile = colonist.work.tile
			const options = Tile.fieldProductionOptions(tile, colonist)
			if (options.length > 1) {			
				const coords = sprite.getGlobalPosition()
				const scale = Util.globalScale(sprite)
				coords.y += 0.5 * sprite.height / 2 - 7

				const optionsView = options.map(Context.productionOption)
				sprite.visible = false
				const decision = await Context.create(optionsView, coords, 64, 0.5 * scale)
				sprite.visible = true
				Colonist.beginFieldWork(colonist, tile, decision.good)
			}
		}
	})

	Drag.makeDraggable(sprite, { colonist })

	return sprite
}

export default { create }