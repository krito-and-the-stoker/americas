import Util from '../util/util'

let mapTiles = null
let colonyBackground = null
let europeBackground = null
let undiscovered = null

const get = () => ({
	mapTiles,
	colonyBackground,
	europeBackground,
	undiscovered
})

const initialize = async () => {
	[mapTiles, colonyBackground, europeBackground, undiscovered] =
		await Util.loadTexture('images/map.png', 'images/colony-screen/background.jpg', 'images/europe.jpg', 'images/undiscovered.jpg')
}


export default {
	initialize,
	get
}