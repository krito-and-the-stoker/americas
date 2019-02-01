import * as PIXI from 'pixi.js'


const inBattleDistance = (unit, other) => distance(unit.mapCoordinates, other.mapCoordinates) < 0.5 * unit.radius

const mergeFunctions = funcArray => funcArray.filter(fn => fn).reduce((all, fn) => () => { all(); fn() }, () => {})

const makeObject = arr => arr.reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})

const globalScale = sprite => {
	let s = sprite
	let scale = s.scale.x
	while(s.parent && s.parent.scale) {
		s = s.parent
		scale *= s.scale.x
	}

	return scale
}

const removeDuplicates = array => array
	.reduce((arr, coords) => {
		if (!arr.includes(coords)) {
			arr.push(coords)
		}
		return arr
	}, [])


const range = n => [...Array(n).keys()]

const quantizedRadius = (coords, radius) => range(2 * radius)
	.map(x => Math.round(x + coords.x - radius))
	.map(x =>
		range(2 * radius)
			.map(y => Math.round(y + coords.y - radius))
			.map(y => ({ x, y }))).flat()
	.filter(({ x, y }) => (x - coords.x) * (x - coords.x) + (y - coords.y) * (y - coords.y) <= radius*radius)


const rectangle = (index) => {
	const width = 64
	const height = 64
	const tilesPerRow = Math.floor(1024 / width)
	const row = Math.floor(index / tilesPerRow)
	const col = index % tilesPerRow
	return new PIXI.Rectangle(width * col, height * row, width, height)
}

const choose = array => array[Math.floor(Math.random() * array.length)]
const unique = (value, index, self) => self.indexOf(value) === index

const distance = (first, second) => Math.sqrt((first.x - second.x) * (first.x - second.x) + (first.y - second.y) * (first.y - second.y))

let currentId = 0
const getUid = () => {
	currentId += 1
	return currentId
}


export default {
	makeObject,
	globalScale,
	range,
	choose,
	rectangle,
	getUid,
	mergeFunctions,
	removeDuplicates,
	unique,
	distance,
	quantizedRadius,
	inBattleDistance
}