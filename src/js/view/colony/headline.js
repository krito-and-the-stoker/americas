import Time from 'timeline/time'

import Tile from 'entity/tile'
import MapEntity from 'entity/map'

import Text from 'render/text'


const create = (colony, originalDimensions) => {
	const nameHeadline = Text.create(colony.name, {
		fontSize: 50,
	})
	nameHeadline.anchor.set(0.5)
	nameHeadline.position.y = 35
	nameHeadline.position.x = originalDimensions.x / 2

	const temperatureText = Text.create()
	temperatureText.x = nameHeadline.width + 10
	temperatureText.y = -10
	nameHeadline.addChild(temperatureText)

	const temperature = Math.round(Tile.temperature(MapEntity.tile(colony.mapCoordinates), Time.season()))
	temperatureText.text = `${temperature} °C`
	const unsubscribe = Time.schedule({ update: () => {
		const temperature = Math.round(Tile.temperature(MapEntity.tile(colony.mapCoordinates), Time.season()))
		temperatureText.text = `${temperature} °C`
		return true
	}})

	return {
		container: nameHeadline,
		unsubscribe
	}
}

export default { create }