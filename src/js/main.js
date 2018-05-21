import Background from './display/background.js'
import Foreground from './display/foreground.js'
import Map from './entity/map.js'
import americaMap from './data/america-large.json'

const initialize = async () => {
	const background = await Background.initialize()
	const foreground = await Foreground.initialize()
	const map = new Map({ data: americaMap })
}


window.addEventListener('load', () => {
	initialize()
})
