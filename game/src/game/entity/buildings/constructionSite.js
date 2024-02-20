const create = (colony, target) => {
	return {
		name: 'construction',
		display: 'Construction Site',
		position: null && colony // <- TODO: use the colony to find a suitable position
		workers: [],
		construction: {
			target,
			progress: 0
		}
	}
}

const save = site => {
	return site
}

const load = data => {
	return data
}

export default {
	create, save, load
}
