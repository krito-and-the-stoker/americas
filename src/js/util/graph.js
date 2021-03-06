const create = () => {
	const nodes = {}
	const addNode = (node, neighbors) => {
		nodes[node.index] = node
		if(neighbors) {
			nodes[node.index].neighbors = neighbors
		}
	}
	const node = index => nodes[index]

	return {
		nodes,
		addNode,
		node
	}
}


export default { create }
