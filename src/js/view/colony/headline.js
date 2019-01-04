import * as PIXI from 'pixi.js'

const create = (colony, originalDimensions) => {
	const nameHeadline = new PIXI.Text(colony.name, {
		fontFamily: 'Times New Roman',
		fontSize: 50,
		fill: 0xffffff,
		align: 'center'
	})
	nameHeadline.anchor.set(0.5)
	nameHeadline.position.y = 35
	nameHeadline.position.x = originalDimensions.x / 2

	return {
		container: nameHeadline
	}
}

export default { create }