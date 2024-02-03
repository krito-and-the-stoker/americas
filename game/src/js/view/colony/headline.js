import Text from 'render/text'


const create = (colony, originalDimensions) => {
	const nameHeadline = Text.create(colony.name, {
		fontSize: 70,
	})
	nameHeadline.anchor.set(0.5)
	nameHeadline.position.y = 50
	nameHeadline.position.x = originalDimensions.x / 2

	return {
		container: nameHeadline,
		unsubscribe: null
	}
}

export default { create }