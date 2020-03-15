import Terrain from 'data/terrain.json'

import Message from 'util/message'

import MapEntity from 'entity/map'
import Tile from 'entity/tile'

import RealMapView from 'view/map'


class MapView{
	constructor() {
		MapView.instance = this
		this.numTiles = MapEntity.get().numTiles
		this.spriteSheetWidth = 1024 / 64
		this.tileStacks = MapEntity.get().tiles.map((tile, index) => {
			return {
				position: {
					x: MapEntity.mapCoordinates(index).x * 64,
					y: MapEntity.mapCoordinates(index).y * 64
				},
				frames: this.assembleTile(tile)
			}
		})
		const totalSprites = this.tileStacks.reduce((count, stack) => count + stack.frames.length, 0)
		if (totalSprites > 0) {
			Message.log(`Using a total of ${totalSprites} sprites for map`)
		}
	}

	assembleTile(tile) {
		return []
			.concat(this.renderBaseBlock(tile))
			.concat(this.renderFarm(tile))
			.concat(this.renderTopTiles(tile))
			.concat(this.renderCoast(tile))
			.concat(this.renderRoads(tile))
			.concat(this.renderBonusResources(tile))
			.concat(this.renderUndiscovered(tile))
	}

	assembleTileXY(coords) {
		const tile = MapEntity.tile(coords)
		return tile ? this.assembleTile(tile) : []
	}

	renderBaseBlock(center){
		let indices = []

		if(!center || !center.discovered())
			return indices

		let left = center.left()
		let right = center.right()
		let up = center.up()
		let down = center.down()

		if(up && right && down && left){		
			let leftUp = left.up()
			let leftDown = left.down()
			let rightUp = right.up()
			let rightDown = right.down()
			if(leftUp && leftDown && rightUp && rightDown){
				indices.push(this.getTileIndex(rightDown, -1, -1, center))
				indices.push(this.getTileIndex(down, 0, -1, center))
				indices.push(this.getTileIndex(leftDown, 1, -1, center))

				indices.push(this.getTileIndex(right, -1, 0, center))
				indices.push(this.getTileIndex(center, 0, 0, center))
				indices.push(this.getTileIndex(left, 1, 0, center))

				indices.push(this.getTileIndex(rightUp, -1, 1, center))
				indices.push(this.getTileIndex(up, 0, 1, center))
				indices.push(this.getTileIndex(leftUp, 1, 1, center))
			}
		}

		return indices
	}


	decideLandSeaTile(center, other){
		// on land always take land
		if(center.terrain.domain === 'land'){
			//either from land
			if(other.terrain.domain === 'land')
				return other.terrain.centerTile
			//or from coast
			if(other.terrain.domain === 'sea' && other.coastTerrain)
				return other.coastTerrain.centerTile
			//or from self
			return center.terrain.centerTile
		}

		// coast wants land from everybody
		if(center.terrain.domain === 'sea' && center.coastTerrain){
			//take land from land tile
			if(other.terrain.domain === 'land')
				return other.terrain.centerTile
			//or from coast terrain
			if(other.coastTerrain)
				return other.coastTerrain.centerTile
			//or from self
			return center.terrain.centerTile
		}

		// sea always wants sea
		if(center.terrain.domain === 'sea' && !center.coastTerrain){
			//take sea tile
			if(other.terrain.domain === 'sea'){
				//either coastal
				if(other.isCoastalSea || other.coastTerrain)
					return Terrain['coastal sea'].centerTile
				//or deep sea
				return other.terrain.centerTile
			}
			//from land tiles take coastal sea
			return Terrain['coastal sea'].centerTile			
		}
	}

	getTileIndex(other, x, y, center){
		return this.decideLandSeaTile(center, other) + this.spriteSheetWidth*y + x
	}

	renderUndiscovered(center){
		let undiscovered = []

		if(!center || !center.discovered())
			return undiscovered

		let left = center.left()
		let right = center.right()
		let up = center.up()
		let down = center.down()


		if(up && right && down && left){		
			let name = this.neighborToName(!up.discovered(), !right.discovered(), !down.discovered(), !left.discovered())
			if(name !== null)
				undiscovered.push(Terrain.undiscovered[name])

			let leftUp = left.up()
			let leftDown = left.down()
			let rightUp = right.up()
			let rightDown = right.down()

			if(leftUp && leftDown && rightUp && rightDown){
				let cornerNames = this.getCornerNames(
					!up.discovered(),
					!rightUp.discovered(),
					!right.discovered(),
					!rightDown.discovered(),
					!down.discovered(),
					!leftDown.discovered(),
					!left.discovered(),
					!leftUp.discovered()
				)
				for(let name of cornerNames){
					undiscovered.push(Terrain.undiscovered[name])
				}
							
			}

		}

		return undiscovered
	}

	renderCoast(tile){
		let indices = []		
		indices = [...indices, ...this.renderCoastLine(tile)]
		indices = [...indices, ...this.renderCoastCorners(tile)]
		indices = [...indices, ...this.renderCoastalSea(tile)]

		return indices
	}

	renderCoastalSea(center){
		let indices = []

		if(!center)
			return indices

		let left = center.left()
		let right = center.right()
		let up = center.up()
		let down = center.down()

		if(
			center &&
			center.discovered() &&
			left &&
			right &&
			up &&
			down &&
			center.terrain.domain === 'sea' &&
			center.coastTerrain
		){
			let leftUp = left.up()
			let leftDown = left.down()
			let rightUp = right.up()
			let rightDown = right.down()

			if(leftUp && rightUp && leftDown && rightDown){
				if(leftUp.terrain.domain === 'sea' && left.terrain.domain === 'sea' && up.terrain.domain === 'sea')
					indices.push(Terrain['coastal sea'].northWestCorner)
				if(leftDown.terrain.domain === 'sea' && left.terrain.domain === 'sea' && down.terrain.domain === 'sea')
					indices.push(Terrain['coastal sea'].southWestCorner)
				if(rightUp.terrain.domain === 'sea' && right.terrain.domain === 'sea' && up.terrain.domain === 'sea')
					indices.push(Terrain['coastal sea'].northEastCorner)
				if(rightDown.terrain.domain === 'sea' && right.terrain.domain === 'sea' && down.terrain.domain === 'sea')
					indices.push(Terrain['coastal sea'].southEastCorner)
			}
		}

		return indices
	}

	renderCoastLine(center){
		let coastTiles = []

		if(!center)
			return coastTiles

		let left = center.left()
		let right = center.right()
		let up = center.up()
		let down = center.down()

		if(
			center.discovered() &&
			left &&
			right &&
			up &&
			down &&
			center.terrain.domain === 'sea'
		){
			let name = this.neighborToName(
				up.terrain.domain === 'land',
				right.terrain.domain === 'land',
				down.terrain.domain === 'land',
				left.terrain.domain === 'land'
			)

			if(name)
				coastTiles.push(Terrain.coast[name])
		}

		return coastTiles
	}

	renderCoastCorners(center){
		let corners = []

		if(center){
			//no corners on land tiles
			if(center.terrain.domain === 'land' || !center.discovered())
				return corners

			let left = center.left()
			let right = center.right()
			let up = center.up()
			let down = center.down()
			if(left && right && up && down){

				let leftUp = left.up()
				let leftDown = left.down()
				let rightUp = right.up()
				let rightDown = right.down()

				if(leftUp && rightUp && leftDown && rightDown){
					let cornerNames = this.getCornerNames(
						up.terrain.domain === 'land',
						rightUp.terrain.domain === 'land',
						right.terrain.domain === 'land',
						rightDown.terrain.domain === 'land',
						down.terrain.domain === 'land',
						leftDown.terrain.domain === 'land',
						left.terrain.domain === 'land',
						leftUp.terrain.domain === 'land'
					)
					for(let name of cornerNames){
						corners.push(Terrain.coast[name])
					}
				}
			}
		}

		return corners
	}

	renderRoads(tile) {
		const indices = []
		if (tile.road) {
			const row = 16
			const col = 1

			const northSouth = [Terrain.road.id + 1*row + 4*col, Terrain.road.id + 2*row + 4*col]
			const eastWest = [Terrain.road.id + 4*col, Terrain.road.id + 5*col]
			const northWestSouthEast = [Terrain.road.id, Terrain.road.id + col, Terrain.road.id + row + col, Terrain.road.id + row]
			const northEastSouthWest = northWestSouthEast.map(id => id + 2*col)

			Tile.diagonalNeighbors(tile)
				.filter(neighbor => neighbor.road)
				.forEach(neighbor => {
					if (neighbor.mapCoordinates.x === tile.mapCoordinates.x) {
						indices.push(neighbor.mapCoordinates.y < tile.mapCoordinates.y ? northSouth[1] : northSouth[0])
						return
					}
					if (neighbor.mapCoordinates.y === tile.mapCoordinates.y) {
						indices.push(neighbor.mapCoordinates.x < tile.mapCoordinates.x ? eastWest[1] : eastWest[0])
						return
					}
					if (neighbor.mapCoordinates.x < tile.mapCoordinates.x && neighbor.mapCoordinates.y < tile.mapCoordinates.y) {
						indices.push(northWestSouthEast[2])
						return
					}
					if	(neighbor.mapCoordinates.x > tile.mapCoordinates.x && neighbor.mapCoordinates.y > tile.mapCoordinates.y) {
						indices.push(northWestSouthEast[0])
						return
					}
					if (neighbor.mapCoordinates.x < tile.mapCoordinates.x && neighbor.mapCoordinates.y > tile.mapCoordinates.y) {
						indices.push(northEastSouthWest[1])
						return
					}
					if	(neighbor.mapCoordinates.x > tile.mapCoordinates.x && neighbor.mapCoordinates.y < tile.mapCoordinates.y) {
						indices.push(northEastSouthWest[3])	
						return
					}
					// indices.push(Terrain.road.id)
				})
		}
		return indices
	}

	renderFarm(tile) {
		const up = Tile.up(tile)
		const right = Tile.right(tile)
		const down = Tile.down(tile)
		const left = Tile.left(tile)

		const indices = []
		if (tile.plowed) {
			const plowedBase = Terrain.plowed.singleTile
			const mod = this.getForestTileModifier(
				up.plowed,
				right.plowed,
				down.plowed,
				left.plowed
			)
			indices.push(plowedBase + mod)
		}

		return indices
	}

	getCornerNames(up, rightUp, right, rightDown, down, leftDown, left, leftUp){
		let cornerNames = []

		if(leftUp && !up && !left){
			cornerNames.push('southEastCorner')
		}
		if(leftDown && !left && !down){
			cornerNames.push('northEastCorner')
		}
		if(rightUp && !right && !up){
			cornerNames.push('southWestCorner')
		}
		if(rightDown && !right && !down){
			cornerNames.push('northWestCorner')
		}

		return cornerNames
	}

	neighborToName(top, right, down, left){
		if(top && !down && !left && !right){
			return 'south'
		}
		if(!top && down && !left && !right){
			return 'north'
		}
		if(!top && !down && left && !right){
			return 'east'
		}
		if(!top && !down && !left && right){
			return 'west'
		}

		if(top && !down && left && !right){
			return 'southEast'
		}
		if(top && !down && !left && right){
			return 'southWest'
		}
		if(!top && down && left && !right){
			return 'northEast'
		}
		if(!top && down && !left && right){
			return 'northWest'
		}

		if(!top && down && left && right){
			return 'southBay'
		}
		if(top && !down && left && right){
			return 'northBay'
		}
		if(top && down && !left && right){
			return 'eastBay'
		}
		if(top && down && left && !right){
			return 'westBay'
		}

		if(top && down && left && right){
			return 'lake'
		}
		if(top && down && !left && !right){
			return 'eastWestPassage'
		}
		if(!top && !down && left && right){
			return 'northSouthPassage'
		}

		return null
	}

	getForestTileModifier(up, right, down, left){
		let y = this.spriteSheetWidth

		if(!up && !right && !down && !left)
			return 0

		if(!up && right && !down && !left)
			return 1
		if(!up && right && !down && left)
			return 2
		if(!up && !right && !down && left)
			return 3

		if(!up && !right && down && !left)
			return 1*y
		if(up && !right && down && !left)
			return 2*y
		if(up && !right && !down && !left)
			return 3*y

		if(!up && right && down && !left)
			return 1*y + 1
		if(!up && right && down && left)
			return 1*y + 2
		if(!up && !right && down && left)
			return 1*y + 3

		if(up && right && down && !left)
			return 2*y + 1
		if(up && right && down && left)
			return 2*y + 2
		if(up && !right && down && left)
			return 2*y + 3

		if(up && right && !down && !left)
			return 3*y + 1
		if(up && right && !down && left)
			return 3*y + 2
		if(up && !right && !down && left)
			return 3*y + 3

	}

	getBonusResourceName(tile){
		if(tile.mountains)
			return 'silver'
		if(tile.hills)
			return 'ore'

		if(tile.name === 'plains' && !tile.forest)
			return 'wheat'
		if(tile.name === 'grassland' && !tile.forest)
			return 'tobacco'
		if(tile.name === 'prairie' && !tile.forest)
			return 'cotton'
		if(tile.name === 'savannah' && !tile.forest)
			return 'sugar'

		if(tile.name === 'tundra' && tile.forest)
			return 'game'
		if(tile.name === 'prairie' && tile.forest)
			return 'game'
		if(tile.name === 'plains' && tile.forest)
			return 'fur'

		if(tile.name  === 'grassland' && tile.forest)
			return 'wood'
		if(tile.name  === 'savannah' && tile.forest)
			return 'wood'

		if(tile.name === 'desert')
			return 'oasis'

		if(tile.name === 'ocean')
			return 'fish'
		if(tile.name === 'coastal sea')
			return 'fish'

		return 'minerals'
	}

	renderBonusResources(center){
		let bonus = []
		if(center && center.discovered() && center.bonus){
			let resourceName = this.getBonusResourceName(center)
			bonus.push(Terrain.bonusResource[resourceName])
		}

		if (center && center.discovered() && center.rumors){
			bonus.push(Terrain.rumors.id)
		}

		return bonus
	}

	renderTopTiles(center){
		let topTiles = []
		if(center && center.discovered()){
			let left = center.left()
			let right = center.right()
			let up = center.up()
			let down = center.down()

			if(left && right && up && down){
				if(center.hills){
					const peakBase = center.hillVariation ? Terrain.hillsPeak.singleTileVariation : Terrain.hillsPeak.singleTile
					// const baseBase = center.hillVariation ? Terrain.hillsBase.singleTileVariation : Terrain.hillsBase.singleTile
					const mod = this.getForestTileModifier(
						up.hills,
						right.hills,
						down.hills,
						left.hills
					)
					// topTiles.push(-(baseBase + mod))
					topTiles.push(peakBase + mod)
				}
				if(center.mountains){
					const peakBase = center.mountainVariation ? Terrain.mountainsPeak.singleTileVariation : Terrain.mountainsPeak.singleTile
					// const baseBase = center.mountainVariation ? Terrain.mountainsBase.singleTileVariation : Terrain.mountainsBase.singleTile
					const mod = this.getForestTileModifier(
						up.mountains,
						right.mountains,
						down.mountains,
						left.mountains
					)
					// topTiles.push(-(baseBase + mod))
					topTiles.push(peakBase + mod)
				}
				if(center.riverSmall){
					let mod = this.getForestTileModifier(up.riverSmall, right.riverSmall, down.riverSmall, left.riverSmall)
					topTiles.push(Terrain['smallRiver'].singleTile + mod)
				}
				if(center.riverLarge){
					let mod = this.getForestTileModifier(up.riverLarge, right.riverLarge, down.riverLarge, left.riverLarge)
					topTiles.push(Terrain['largeRiver'].singleTile + mod)
				}
				if(center.forest && RealMapView.isForestVisible()){
					let mod = this.getForestTileModifier(
						up.forest && !(center.treeVariation && up.treeVariation),
						right.forest && !(center.treeVariation && right.treeVariation),
						down.forest && !(center.treeVariation && down.treeVariation),
						left.forest && !(center.treeVariation && left.treeVariation)
					)
					const baseForestTile = [Terrain.forest.singleTile, Terrain.forest.singleTileVariation, Terrain.forest.singleTileVariation2][center.treeVariation]
					topTiles.push(baseForestTile + mod)
				}
			}

		}

		return topTiles
	}

}

export default MapView