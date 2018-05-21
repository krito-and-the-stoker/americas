import * as PIXI from 'pixi.js'

const loadTexture = async (...files) => new Promise((resolve, reject) => {
	PIXI.loader.add(files).load(() => {
		resolve(files.map(path => PIXI.loader.resources[path].texture))
	})
})

const range = n => [...Array(n).keys()]

const rectangle = index => {
	const width = 64
	const height = 64
	const tilesPerRow = Math.floor(1024 / width)
	const row = Math.floor(index / tilesPerRow)
	const col = index % tilesPerRow
	return new PIXI.Rectangle(width * col, height * row, width, height)
}

const initialize = async () => {
	//Create a Pixi Application
	const [width, height] = [window.innerWidth, window.innerHeight]
	let app = new PIXI.Application({width: 256, height: 256})
	app.renderer.view.style.position = "absolute";
	app.renderer.view.style.display = "block";
	app.renderer.autoResize = true;
	app.renderer.resize(window.innerWidth, window.innerHeight);

	//Add the canvas that Pixi automatically created for you to the HTML document
	document.body.appendChild(app.view)

	const [undiscovered, map] = await loadTexture('images/undiscovered.jpg', 'images/map.png')
	const background = new PIXI.Sprite(undiscovered)
	app.stage.addChild(background)
	const numberOfSprites = 50000
	console.log(`Benchmarking ${numberOfSprites} sprites`)
	const container = new PIXI.particles.ParticleContainer();
	// const container = new PIXI.Container();
	app.stage.addChild(container)
	const tiles = range(numberOfSprites).map(index => new PIXI.Sprite(new PIXI.Texture(map, rectangle(Math.floor(150*Math.random())))))
	tiles.forEach((tile, index) => {
		tile.vx = (Math.random() - .5)
		tile.vy = (Math.random() - .5)
		tile.x = Math.round(width / 2)
		tile.y = Math.round(height / 2)
		tile.exactX = tile.x
		tile.exactY = tile.y
		container.addChild(tile)
	})

	
	app.ticker.add(() => {
		tiles.forEach(tile => {
			if (!container.cacheAsBitmap) {			
				tile.exactX += tile.vx
				tile.exactY += tile.vy
				tile.x = Math.round(tile.exactX)
				tile.y = Math.round(tile.exactY)
			}
		})
	})

	let running = true
	const toggleFreeze = () => {
		running = !running
		if (!running)
			app.stop()
		if (running)
			app.start()
		// container.cacheAsBitmap = !container.cacheAsBitmap
	}
	window.addEventListener('click', toggleFreeze)
}


window.addEventListener('load', () => {
	initialize()
})
