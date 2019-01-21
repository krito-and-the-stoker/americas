import Icons from '../data/icons.json'
import Ressources from '../render/ressources'
import Util from '../util/util'

const createSprite = frame => new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame)))
const create = name => createSprite(Icons[name])


export default {
	create
}