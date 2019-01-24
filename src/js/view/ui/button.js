import * as PIXI from 'pixi.js'
import Click from 'input/click'
import Resources from 'render/resources'
import Text from 'render/text'

const create = (text, fn) => {
	const container = new PIXI.Container()
	const button = Text.create(text, {
		fill: 0x000000,
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