import ColonyView from '../view/colony'

let colonieNames = ['Jamestown', 'Roanoke', 'Virginia', "Cuper's Cove", "St. John's", 'Henricus']
const getColonyName = () => colonieNames.shift()

const create = coords => {
	const colony = {
		name: getColonyName(),
		mapCoordinates: { ...coords }
	}
	colony.screen = ColonyView.createDetailScreen(colony)
	colony.sprite = ColonyView.createMapSprite(colony)
	console.log(colony)
	return colony
}

export default {
	create
}