import * as PIXI from 'pixi.js'


const binding = fieldName => {
	const listeners = `${fieldName}Listeners`
	const init = instance => {
		instance[listeners] = []
	}

	const bind = (instance, fn) => {
		fn(instance[fieldName])
		instance[listeners].push(fn)
		const remove = () => instance[listeners] = instance[listeners].filter(f => f !== fn)
		return remove
	}

	const update = (instance, value) => {
		if (value !== undefined) {
			instance[fieldName] = value
		}
		instance[listeners].forEach(fn => fn(instance[fieldName]))
	}

	return {
		init,
		bind,
		update,
	}
}

const globalScale = sprite => {
	let s = sprite
	let scale = s.scale.x
	while(s.parent && s.parent.scale) {
		s = s.parent
		scale *= s.scale.x
	}

	return scale
}

export const loadTexture = async (...files) => new Promise((resolve, reject) => {
	PIXI.loader.reset()
	PIXI.loader.add(files).load(() => {
		resolve(files.map(path => PIXI.loader.resources[path].texture))
	})
});

export const range = n => [...Array(n).keys()]

export const rectangle = index => {
	const width = 64
	const height = 64
	const tilesPerRow = Math.floor(1024 / width)
	const row = Math.floor(index / tilesPerRow)
	const col = index % tilesPerRow
	return new PIXI.Rectangle(width * col, height * row, width, height)
}

let currentId = 0
const getUid = () => {
	currentId += 1
	return currentId
}

export default {
	loadTexture,
	globalScale,
	range,
	rectangle,
	getUid,
	binding,
}