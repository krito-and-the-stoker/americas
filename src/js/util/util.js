import 'util/polyfills'
import Names from 'data/names'
import Clone from 'clone'

const inBattleDistance = (unit, other) => distance(unit.mapCoordinates, other.mapCoordinates) < 0.5 * unit.radius
const inDistance = (unit, other) => distance(unit.mapCoordinates, other.mapCoordinates) < 0.5 * unit.radius

const isArray = something => something && something.constructor === Array
const flatten = array => {
	const result = array.flat()
	return result.some(value => isArray(value)) ? flatten(result) : result
}

let names = Names
const tag = () => {
	const name = choose(names)
	names = names.filter(n => n !== name)
	if (names.length === 0) {
		console.warn('Resetting names. Consider using more in future.')
		names = Names
	}

	return name
}

const isFunction = something => typeof something === 'function'

// const mergeFunctions = funcArray => funcArray.filter(fn => isFunction(fn)).reduce((all, fn) => arg => { all(arg); fn(arg) }, () => {})
// const mergeFunctionsFlat = funcArray => mergeFunctions(flatten(funcArray))
const execute = (something, arg) => {
	if (!something) {
		return null
	}

	if (isFunction(something)) {
		return something(arg)
	}

	if (isArray(something)) {
		return flatten(something).filter(isFunction).map(fn => fn(arg))
	}

	console.warn('unable to execute', something)
	throw new Error('unable to execute')
}

const makeObject = arr => arr.reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
const clone = something => Clone(something)

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


const choose = array => array[Math.floor(Math.random() * array.length)]
const unique = (value, index, self) => self.indexOf(value) === index
const sum = array => array.reduce((all, single) => all + single, 0)

// const minDistance = (many, one) => many.reduce((min, test) => Math.min(min, distance(test, one)), 1e10)
const minDistance = (many, one) => distance(min(many, other => distance(one, other)), one)
const distance = (first, second) => Math.sqrt((first.x - second.x) * (first.x - second.x) + (first.y - second.y) * (first.y - second.y))
const entityDistance = (one, other) => distance(one.mapCoordinates, other.mapCoordinates)

const min = (many, fn) => many.reduce((best, test) => (best && fn(best) < fn(test)) ? best : test, null)
const minPair = (many, some, fn) => min(many.map(one => ({
	one,
	other: min(some, other => fn(one, other))
})), ({ one, other }) => fn(one, other))
const minPairValue = (many, some, fn) => {
	const pair = minPair(many, some, fn)
	return fn(pair.one, pair.other)
}


const pairs = (many, some) => many.map(one => some.map(other => ({
	one,
	other
}))).flat()


let currentId = 0
const uid = () => {
	currentId += 1
	return currentId
}


export default {
	clone,
	makeObject,
	tag,
	globalScale,
	range,
	choose,
	isFunction,
	uid,
	execute,
	isArray,
	flatten,
	removeDuplicates,
	unique,
	distance,
	minDistance,
	entityDistance,
	quantizedRadius,
	inBattleDistance,
	inDistance,
	min,
	minPair,
	minPairValue,
	pairs,
	sum
}