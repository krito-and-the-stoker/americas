import Units from '../data/units.json'
import Util from '../util/util'
import Ressources from '../render/ressources'
import Click from '../input/click'
import Drag from '../input/drag'


const frames = Units.settler.frame

const create = colonist => {
	const frame = colonist.expert ? frames[colonist.expert] || frames.default : frames.default
	const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame)))

	Click.on(sprite, () => {
		console.log('open context menu')
	})

	Drag.makeDraggable(sprite, colonist)

	return sprite
}

export default { create }