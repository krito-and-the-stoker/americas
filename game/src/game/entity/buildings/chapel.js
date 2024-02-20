const create = colony => {
	return {
		name: 'chapel',
		level: 1,
		display: 'Chapel',
		position: null && colony // <- TODO: use the colony to find a suitable position
		workers: [],
		construction: {
			target: null,
			queue: []
		}
	}
}

const save = chapel => {
	return chapel
}

const load = data => {
	return data
}

export default {
	create, save, load
}
