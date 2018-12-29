import Terrain from '../data/terrain.json';

class MapTile {
	constructor({ id, layers, index, map }){

		this.index = index
		this.map = map

		const [name, terrain] = Object.entries(Terrain).find(([name, terrain]) => terrain.id === id)
		if (!terrain) {
			console.warn(`No terrain type found for id ${id}.`)
			throw new Error(`No terrain type found for id ${id}.`)
		}

		this.name = name
		this.terrain = terrain
		this.forest = layers.top === Terrain.forest.id
		this.mountains = layers.top === Terrain.mountains.id
		this.hills = layers.top === Terrain.hills.id || (this.mountains && Math.random() > 0.1);
		this.riverSmall = layers.riverSmall === Terrain.smallRiver.id
		this.riverLarge = layers.riverLarge === Terrain.largeRiver.id
		this.river = this.riverLarge || this.riverSmall
		this.bonus = layers.bonus ===  Terrain.bonusResource.id
		this.treeVariation = this.riverLarge || Math.random() > (this.river ? 0.2 : 0.6);
		this.mountainVariation = Math.random() > (this.river ? 0.2 : 0.75) && !this.bonus || this.mountains;
		this.hillVariation = Math.random() > (this.river ? 0.2 : 0.75) && !this.bonus;

		this.discovered = true

		// these variables make no sense as of now
		this.plowed = false;
		this.road = false;
		this.coast = false;
		this.coastTerrain = null;
	}

	left() {
		return this.map.neighbor(this.index, -1, 0)
	}

	up() {
		return this.map.neighbor(this.index, 0, -1)
	}

	right() {
		return this.map.neighbor(this.index, 1, 0)
	}

	down() {
		return this.map.neighbor(this.index, 0, 1)
	}

	decideCoastTerrain() {
		if(this.terrain && this.terrain.domain === 'sea'){
			let left = this.left();
			let right = this.right();
			let up = this.up();
			let down = this.down();

			let landNeighbor = null;
			if(left && left.terrain && left.terrain.domain === 'land')
				landNeighbor = left;
			if(right && typeof right.terrain !== 'undefined' && right.terrain.domain === 'land')
				landNeighbor = right;
			if(up && typeof up.terrain !== 'undefined' && up.terrain.domain === 'land')
				landNeighbor = up;
			if(down && typeof down.terrain !== 'undefined' && down.terrain.domain === 'land')
				landNeighbor = down;

			if(landNeighbor)
				this.coastTerrain = landNeighbor.terrain;

			if(landNeighbor === null && left && right){
				let leftUp = left.up();
				let leftDown = left.down();
				let rightUp = right.up();
				let rightDown = right.down();

				if(leftUp && typeof leftUp.terrain !== 'undefined' && leftUp.terrain.domain === 'land')
					landNeighbor = leftUp;
				if(leftDown && typeof leftDown.terrain !== 'undefined' && leftDown.terrain.domain === 'land')
					landNeighbor = leftDown;
				if(rightUp && typeof rightUp.terrain !== 'undefined' && rightUp.terrain.domain === 'land')
					landNeighbor = rightUp;
				if(rightDown && typeof rightDown.terrain !== 'undefined' && rightDown.terrain.domain === 'land')
					landNeighbor = rightDown;

				if(landNeighbor)
					this.coastTerrain = landNeighbor.terrain;
			}
		}

		if(this.coastTerrain)
			this.coast = true;
	}

	decideCoastalSea() {
		this.isCoastalSea = false;
		if(typeof this.terrain !== 'undefined' && this.terrain.domain === 'sea' && this.coastTerrain === null){
			let left = this.left();
			let right = this.right();
			let up = this.up();
			let down = this.down();
			if(left && right){
				let leftUp = left.up();
				let leftDown = left.down();
				let rightUp = right.up();
				let rightDown = right.down();

				if(
					up && rightUp && right && rightDown &&
					down && leftDown && left && leftUp
				){
				this.isCoastalSea =
					(up.coastTerrain !== null) ||
					(rightUp.coastTerrain !== null) ||
					(right.coastTerrain !== null) ||
					(rightDown.coastTerrain !== null) ||
					(down.coastTerrain !== null) ||
					(leftDown.coastTerrain !== null) ||
					(left.coastTerrain !== null) ||
					(leftUp.coastTerrain !== null);
				}
			}
		}
	}
}

export default MapTile
