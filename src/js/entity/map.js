import Tile from './tile.js'
// import MapView from 'src/view/map/mapView.js'
// import PathFinder from 'src/model/ai/pathFinder.js'

class Map{
	constructor({ data }) {
		console.log('creating map')

		const baseLayer = Map.layer(data, 'terrain base')
		this.numTiles = {
			x: baseLayer.width,
			y: baseLayer.height,
		}
		this.numTiles.total = this.numTiles.x * this.numTiles.y

		Map.instance = this

		console.log('creating tiles')
		this.tiles = Map.layer(data, 'terrain base').data.map((id, index) => new Tile({
			id,
			layers: {
				top: Map.layer(data, 'terrain top').data[index],
				riverSmall: Map.layer(data, 'terrain river small').data[index],
				riverLarge: Map.layer(data, 'terrain river large').data[index],
				bonus: Map.layer(data, 'terrain bonus').data[index]
			}
		}))
		console.log('creating coast line')
		// this.createCoastLine()
		console.log('creating graph')
		// this.path = new PathFinder({
		// 	map: this
		// })

		console.log('creating view')
		// this.view = new MapView({
		// 	map: this
		// })

		console.log('map created.')
	}

	static layer(data, name){
		return data.layers.find((layer) => layer.name === name)
	}

	// createCoastLine(){
	// 	//look for coasts and create coast lines
	// 	this.tiles.forEach((tile) => {
	// 		tile.decideCoastTerrain()
	// 	})
	// 	this.tiles.forEach((tile) => {
	// 		tile.decideCoastalSea()
	// 	})
	// }

}

export default Map