import * as PIXI from 'pixi.js'

const loadTexture = async (...files) => new Promise((resolve, reject) => {
	PIXI.Loader.shared.add(files).load(() => {
		resolve(files.map(path => PIXI.Loader.shared.resources[path].texture))
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
	const numberOfSprites = 10
	console.log(`Benchmarking ${numberOfSprites} sprites`)
	const container = new PIXI.ParticleContainer(numberOfSprites);
	app.stage.addChild(container)
	const tiles = range(numberOfSprites).map(index => new PIXI.Sprite(new PIXI.Texture(map, rectangle(Math.floor(150*Math.random())))))
	tiles.forEach((tile, index) => {
		tile.vx = (Math.random() - .5)
		tile.vy = (Math.random() - .5)
		tile.x = width / 2
		tile.y = height / 2
		container.addChild(tile)
	})

	
	app.ticker.add(() => {
		tiles.forEach(tile => {
			tile.x += tile.vx
			tile.y += tile.vy
		})
	})

	const toggleFreeze = () => {
		container.cacheAsBitmap = !container.cacheAsBitmap
	}
	window.addEventListener('click', toggleFreeze)
}


window.addEventListener('load', () => {
	initialize()
})
