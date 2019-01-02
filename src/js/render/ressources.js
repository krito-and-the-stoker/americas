import Util from '../util/util'

let map = null
let colonyBackground = null
let europeBackground = null

const get = () => ({
	map,
	colonyBackground,
	europeBackground
})

const initialize = async () => {
	[map, colonyBackground, europeBackground] = await Util.loadTexture('images/map.png', 'images/colony.png', 'images/europe.jpg')
}


export default {
	initialize,
	get
}