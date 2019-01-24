import * as PIXI from 'pixi.js'
import Click from '../../input/click'
import Resources from '../../render/resources'

const create = (text, fn) => {
	const container = new PIXI.Container()
	const button = new PIXI.Text(text, {
		fontFamily: 'Times New Roman',
		fontSize: 32,
		fill: 0x000000,
		align: 'center'
	})
	const background = Resources.sprite('buttonBackground')
	background.width = button.width
	background.height = button.height
	Click.on(background, fn)

	container.addChild(background)
	container.addChild(button)

	return container
}

export default { create }