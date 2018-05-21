import MapTile from './tile.js'
// import MapView from 'src/view/map/mapView.js'
// import PathFinder from 'src/model/ai/pathFinder.js'

class MapEntity {
	constructor({ data }) {
		console.log('creating map')

		const baseLayer = MapEntity.layer(data, 'terrain base')
		this.numTiles = {
			x: baseLayer.width,
			y: baseLayer.height,
		}
		this.numTiles.total = this.numTiles.x * this.numTiles.y

		MapEntity.instance = this

		console.log('creating tiles')
		this.tiles = MapEntity.layer(data, 'terrain base').data.map((id, index) => new MapTile({
			id,
			index,
			map: this,
			layers: {
				top: MapEntity.layer(data, 'terrain top').data[index],
				riverSmall: MapEntity.layer(data, 'terrain river small').data[index],
				riverLarge: MapEntity.layer(data, 'terrain river large').data[index],
				bonus: MapEntity.layer(data, 'terrain bonus').data[index]
			}
		}))
		console.log('creating coast line')
		this.createCoastLine()
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

	neighbor(center, x, y) {
		let resultIndex = center + x + this.numTiles.x * y
		return resultIndex >= 0 && resultIndex < this.tiles.length ? this.tiles[resultIndex] : 0
	}

	position(center) {
		return {
			x: (center % this.numTiles.x) * 64,
			y: Math.floor(center / this.numTiles.x) * 64,
		}
	}

	createCoastLine(){
		//look for coasts and create coast lines
		this.tiles.forEach(tile => {
			tile.decideCoastTerrain()
		})
		this.tiles.forEach(tile => {
			tile.decideCoastalSea()
		})
	}

}

export default MapEntity