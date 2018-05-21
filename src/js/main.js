import Background from './background.js'
import Foreground from './foreground.js'

const initialize = async () => {
	await Background.initialize()
	await Foreground.initialize()
}


window.addEventListener('load', () => {
	initialize()
})
