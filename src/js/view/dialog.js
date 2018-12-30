import Foreground from '../render/foreground'
import RenderView from '../render/view'
import Time from '../timeline/time'

const create = (message, options) => {
	let optionTexts = []
	const menu = Foreground.get().menu
	const text = new PIXI.Text(message, {
		fontFamily: 'Times New Roman',
		fontSize: 24,
		fill: 0xffffff,
		align: 'center'
	})
	menu.addChild(text)
	text.anchor.set(0.5)
	text.position.x = RenderView.getCenter().x
	text.position.y = RenderView.getCenter().y

	const destroy = () => {
		menu.removeChild(text)
		optionTexts.forEach(optionText => menu.removeChild(optionText))
		Time.resume()
	}

	optionTexts = options.map((msg, index) => {
		const optionText = new PIXI.Text(msg, {
			fontFamily: 'Times New Roman',
			fontSize: 24,
			fill: 0xffffff,
			align: 'center'
		})
		optionText.anchor.set(0.5)
		optionText.position.x = RenderView.getCenter().x
		optionText.position.y = RenderView.getCenter().y + 80 + 30*index
		optionText.interactive = true
		optionText.buttonMode = true
		optionText.on('pointerdown', destroy)
		menu.addChild(optionText)
		return optionText
	})

	Time.pause()
}

export default { create }