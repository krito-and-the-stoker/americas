const createColonySprite = unit => {
	if (!unit.colonySprite) {	
		const frame = unit.expert ? unit.properties.frame[unit.expert] || unit.properties.frame.default : unit.properties.frame.default
		const sprite = new PIXI.Sprite(new PIXI.Texture(Ressources.get().mapTiles, Util.rectangle(frame)))
		sprite.scale.set(2)

		unit.colonySprite = sprite
	}

	return unit.colonySprite
}

export default {
	createColonySprite
}