import * as PIXI from 'pixi.js'

import Message from 'view/ui/message'
import NumberOfAssets from 'data/numberOfAssets'


const mergeFunctions = funcArray => funcArray.reduce((all, fn) => () => { all(); fn(); }, () => {})

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


export const range = n => [...Array(n).keys()]

export const rectangle = (index) => {
	const width = 64
	const height = 64
	const tilesPerRow = Math.floor(1024 / width)
	const row = Math.floor(index / tilesPerRow)
	const col = index % tilesPerRow
	return new PIXI.Rectangle(width * col, height * row, width, height)
}

const choose = array => array[Math.floor(Math.random() * array.length)]
const unique = (value, index, self) => self.indexOf(value) === index


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
	makeObject,
	removeDuplicates,
	unique
}