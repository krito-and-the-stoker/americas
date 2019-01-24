import Text from 'src/render/text'

const create = (colony, originalDimensions) => {
	const nameHeadline = Text.create(colony.name, {
		fontSize: 50,
	})
	nameHeadline.anchor.set(0.5)
	nameHeadline.position.y = 35
	nameHeadline.position.x = originalDimensions.x / 2

	return {
		container: nameHeadline
	}
}

export default { create }