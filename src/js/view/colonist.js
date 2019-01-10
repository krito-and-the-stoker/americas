import Units from '../data/units.json'
import Util from '../util/util'
import Ressources from '../render/ressources'
import Click from '../input/click'
import Drag from '../input/drag'
import Tile from '../entity/tile'
import Context from '../view/context'
import Colonist from '../entity/colonist'


const frames = Units.settler.frame

const create = colonist => {
	const frame = colonist.expert ? frames[colonist.expert] || frames.default : frames.default
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame)))

	Click.on(sprite, async () => {
		if (colonist.work) {
			const tile = colonist.work.tile
			const options = Tile.fieldProductionOptions(tile, colonist)
			if (options.length > 1) {			
				const coords = colonist.sprite.getGlobalPosition()
				const scale = Util.globalScale(colonist.sprite)
				coords.y += 0.5 * colonist.sprite.height / 2

				const optionsView = options.map(Context.productionOption)
				const decision = await Context.create(optionsView, coords, 80, 0.5 * scale)
				Colonist.beginFieldWork(colonist, tile, decision.good)
			}
		}
	})

	Drag.makeDraggable(sprite, { colonist })

	return sprite
}

export default { create }