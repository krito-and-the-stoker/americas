import * as PIXI from 'pixi.js'
import Message from 'util/message'


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
	status: 'images/status.png',
	stockade: 'images/colony-screen/stockade.png',
	fort: 'images/colony-screen/fort.png',
	fortress: 'images/colony-screen/fortress.png',
	native1: 'images/characters-head/native1.png',
	native2: 'images/characters-head/native2.png',
	native3: 'images/characters-head/native3.png',
	native4: 'images/characters-head/native4.png',
	native5: 'images/characters-head/native5.png',
	native6: 'images/characters-head/native6.png',
	native7: 'images/characters-head/native7.png',
	native8: 'images/characters-head/native8.png',
	native9: 'images/characters-head/native9.png',
	discovery: 'images/fullscreen-events/discovery.jpg',
	firstColony: 'images/fullscreen-events/first-colony.jpg',
	enteringVillage: 'images/fullscreen-events/entering-village.jpg',
	firstFreight: 'images/fullscreen-events/first-freight.jpg',
	tutorialFrame: 'images/tutorial-frame.png'
}

const textures = {
	white: PIXI.Texture.WHITE
}

const videos = {
	colony: 'videos/tutorial/colony.mp4',
	equip: 'videos/tutorial/equip.mp4',
	foundColony: 'videos/tutorial/found-colony.mp4',
	goEurope: 'videos/tutorial/go-europe.mp4',
	inEurope: 'videos/tutorial/in-europe.mp4',
	landfall: 'videos/tutorial/landfall.mp4',
	move: 'videos/tutorial/move.mp4',
	pioneer: 'videos/tutorial/pioneer.mp4',
	drag: 'videos/tutorial/drag.mp4',
	select: 'videos/tutorial/select.mp4',
	zoom: 'videos/tutorial/zoom.mp4',
}

const rectangle = (index) => {
	const width = 64
	const height = 64
	const tilesPerRow = Math.floor(1024 / width)
	const row = Math.floor(index / tilesPerRow)
	const col = index % tilesPerRow
	return new PIXI.Rectangle(width * col, height * row, width, height)
}

const texture = (name, options = {}) => {
	if (!textures[name]) {
		console.warn('Texture not found in textures:', name, textures)
		return textures.white
	}
	if (options.frame || options.frame === 0) {
		return new PIXI.Texture(textures[name], rectangle(options.frame))
	}
	if (options.rectangle) {
		return new PIXI.Texture(textures[name], options.rectangle)
	}
	return new PIXI.Texture(textures[name])
}

const video = name => {
	if (!textures[name]) {
		textures[name] = PIXI.Texture.fromVideo(videos[name])
	}

	return sprite(name)
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
}


export default {
	initialize,
	video,
	sprite,
	texture,
	numberOfAssets
}