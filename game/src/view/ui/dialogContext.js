import MapView from 'view/map'

const centerMap = (coords) => {
	MapView.centerAt(coords, 350)
}

export default {
	functions: {
		centerMap
	}
}
