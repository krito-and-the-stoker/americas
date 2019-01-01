import Util from '../util/util'

let map = null

const get = () => ({
	map
})

const initialize = async () => {
	[map] = await Util.loadTexture('images/map.png')
}


export default {
	initialize,
	get
}