import MapEntity from '../entity/map'
import Message from '../view/ui/message'
import Background from '../render/background'

export default unit => {
	const tile = MapEntity.tile(unit.mapCoordinates)
	tile.rumors = false
	Background.render()
	Message.send('You find nothing but rumors')
}