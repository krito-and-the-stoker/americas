import * as PIXI from 'pixi.js'
import Message from 'view/ui/message'
import Util from 'util/util'


let counter = 2
const logDownloadProgress = () => {
	counter += 1
	Message.log(`Downloading files (${counter}/${numberOfAssets()})...`)		
}

const queueTextureVerbose = async path => new Promise(resolve => {
	PIXI.loader.onComplete.add(() => resolve(PIXI.loader.resources[path].texture))
	PIXI.loader.add(path)
})

const numberOfAssets = () => 2 + Object.entries(paths).length

const paths = {
	map: 'images/map.png',
	colonyBackground: 'images/colony-screen/background.jpg',
	europeBackground: 'images/europe.jpg',
	undiscovered: 'images/undiscovered.jpg',
	colonyWoodBackground: 'images/colony-screen/wood-background.jpg',
	goodsBackground: 'images/goods-background.jpg',
	buildings: 'images/colony-screen/buildings.png',
	help: 'images/help.jpg',
	welcome: 'images/welcome.png',
	ring: 'images/ring.png',
	coastup: 'images/colony-screen/coast-up.png',
	coastrightup: 'images/colony-screen/coast-rightup.png',
	coastright: 'images/colony-screen/coast-right.png',
	coastrightdown: 'images/colony-screen/coast-rightdown.png',
	coastdown: 'images/colony-screen/coast-down.png',
	coastleftdown: 'images/colony-screen/coast-leftdown.png',
	coastleft: 'images/colony-screen/coast-left.png',
	coastleftup: 'images/colony-screen/coast-leftup.png',
	admiral: 'images/dialog-characters/admiral.png',
	govenor: 'images/dialog-characters/govenor.png',
	kingJames: 'images/dialog-characters/king-james.png',
	marshal: 'images/dialog-characters/marshal.png',
	religion: 'images/dialog-characters/religion.png',
	scout: 'images/dialog-characters/scout.png',
	native: 'images/dialog-characters/native-north-east-a.png',
	status: 'images/status.png',
	stockade: 'images/colony-screen/stockade.png',
	fort: 'images/colony-screen/fort.png',
	fortress: 'images/colony-screen/fortress.png'
}

const textures = {}


const texture = (name, options = {}) => {
	if (!textures[name]) {
		console.warn('Texture not found in textures:', name, textures)
	}
	if (options.frame || options.frame === 0) {
		return new PIXI.Texture(textures[name], Util.rectangle(options.frame))
	}
	if (options.rectangle) {
		return new PIXI.Texture(textures[name], options.rectangle)
	}
	return new PIXI.Texture(textures[name])
}

const sprite = (name, options) => new PIXI.Sprite(texture(name, options))

let loadAllPromise = null
const loadAll = () => {
	if (!loadAllPromise) {	
		loadAllPromise = Promise.all(Object.entries(paths)
			.map(([key, path]) => 
				queueTextureVerbose(path).then(texture => ({
					key,
					texture
				})).then(({ key, texture }) => {
					textures[key] = texture
				})))

		PIXI.loader.onLoad.add(logDownloadProgress)
		requestAnimationFrame(() => {
			PIXI.loader.load()
		})
	}

	return loadAllPromise
}

const initialize = () => {
	return loadAll()
	// return Util.loadTextureVerbose('images/colony-screen/coast-up.png',
	// 	'images/colony-screen/coast-rightup.png',
	// 	'images/colony-screen/coast-right.png',
	// 	'images/colony-screen/coast-rightdown.png',
	// 	'images/colony-screen/coast-down.png',
	// 	'images/colony-screen/coast-leftdown.png',
	// 	'images/colony-screen/coast-left.png',
	// 	'images/colony-screen/coast-leftup.png'
	// ).then(([up, rightup, right, rightdown, down, leftdown, left, leftup]) => {
	// 	colonyScreenCoast.up = up
	// 	colonyScreenCoast.rightup = rightup
	// 	colonyScreenCoast.right = right
	// 	colonyScreenCoast.rightdown = rightdown
	// 	colonyScreenCoast.down = down
	// 	colonyScreenCoast.leftdown = leftdown
	// 	colonyScreenCoast.left = left
	// 	colonyScreenCoast.leftup = leftup
	// }).then(() => Util.loadTextureVerbose('images/map.png',
	// 	'images/colony-screen/background.jpg',
	// 	'images/europe.jpg',
	// 	'images/undiscovered.jpg',
	// 	'images/colony-screen/wood-background.jpg',
	// 	'images/goods-background.jpg',
	// 	'images/colony-screen/buildings.png',
	// 	'images/help.jpg',
	// 	'images/welcome.png',
	// 	'images/ring.png'
	// )).then(result => {
	// 	mapTiles = result[0]
	// 	colonyBackground = result[1]
	// 	europeBackground = result[2]
	// 	undiscovered = result[3]
	// 	colonyWoodBackground = result[4]
	// 	goodsBackground = result[5]
	// 	buildings = result[6]
	// 	help = result[7]
	// 	welcome = result[8]
	// 	ring = result[9]
	// })
}


export default {
	initialize,
	sprite,
	texture,
	numberOfAssets
}