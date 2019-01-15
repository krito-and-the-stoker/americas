import Util from '../util/util'

let mapTiles = null
let colonyBackground = null
let europeBackground = null
let undiscovered = null
let colonyWoodBackground = null
let goodsBackground = null
let buildings = null
let colonyScreenCoast = {}

const get = () => ({
	mapTiles,
	colonyBackground,
	europeBackground,
	undiscovered,
	colonyScreenCoast,
	colonyWoodBackground,
	goodsBackground,
	buildings
})

const initialize = async () => {
	const [up, rightup, right, rightdown, down, leftdown, left, leftup] =
		await Util.loadTexture(
			'images/colony-screen/coast-up.png',
			'images/colony-screen/coast-rightup.png',
			'images/colony-screen/coast-right.png',
			'images/colony-screen/coast-rightdown.png',
			'images/colony-screen/coast-down.png',
			'images/colony-screen/coast-leftdown.png',
			'images/colony-screen/coast-left.png',
			'images/colony-screen/coast-leftup.png'
		)
	colonyScreenCoast.up = up
	colonyScreenCoast.rightup = rightup
	colonyScreenCoast.right = right
	colonyScreenCoast.rightdown = rightdown
	colonyScreenCoast.down = down
	colonyScreenCoast.leftdown = leftdown
	colonyScreenCoast.left = left
	colonyScreenCoast.leftup = leftup

	[mapTiles, colonyBackground, europeBackground, undiscovered, colonyWoodBackground, goodsBackground, buildings] =
		await Util.loadTexture('images/map.png',
			'images/colony-screen/background.jpg',
			'images/europe.jpg',
			'images/undiscovered.jpg',
			'images/colony-screen/wood-background.jpg',
			'images/goods-background.jpg',
			'images/colony-screen/buildings.png')


	console.log(undiscovered)
}


export default {
	initialize,
	get
}