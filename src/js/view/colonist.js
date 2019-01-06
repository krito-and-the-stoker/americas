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
		if (colonist.worksAt) {
			const tile = colonist.worksAt.tile
			const options = Tile.fieldProductionOptions(tile, colonist).map(Context.productionOption)
			const coords = colonist.sprite.getGlobalPosition()
			const decision = await Context.create(options, coords, 80, 0.5)
			Colonist.beginFieldWork(colonist, tile, decision.good)
		}
	})

	Drag.makeDraggable(sprite, colonist)

	return sprite
}

export default { create }