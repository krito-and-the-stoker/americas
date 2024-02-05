import { saveSerializedCopy } from 'entity/tile'
import Version from 'version/version'


let tileDictionary = {}
let tileLookup = []
const getTileLookup = tile => {
	const s = tile.join('-')
	if (!tileDictionary[s]) {
		tileDictionary[s] = tileLookup.length
		tileLookup.push(tile)
	}

	return tileDictionary[s]
}


let data = {
	tiles: []
}
onmessage = e => {
	if (e.data === 'save') {
		data.tiles = [].concat.apply([], data.tiles)
		save()
		return
	}

	if (e.data === 'clear') {
		data = {
			tiles: []
		}
		return
	}

	if (e.data.tiles) {
		data.tiles.push(e.data.tiles)
		return
	}

	Object.keys(e.data).forEach(key => {
		data[key] = e.data[key]
	})

}

const save = () => {
	tileDictionary = {}
	tileLookup = []

	data.tiles = data.tiles.map(saveSerializedCopy)
	data.tiles = data.tiles.map(getTileLookup)
	data.game = 'americas',
	data.revision = Version.revision
	data.tileLookup = tileLookup
	const content = JSON.stringify(data)

	postMessage(content)

	data = {
		tiles: []
	}
}