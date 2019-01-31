import Tween from 'util/tween'

import Foreground from 'render/foreground'
import RenderView from 'render/view'
import Text from 'render/text'

import Events from 'view/ui/events'


const create = () => {
	const text = Text.create('game saved')
	text.y = 10

	const unsubscribe = RenderView.listen.dimensions(dimensions => {
		text.x = (dimensions.x - text.width) / 2
	})

	Foreground.get().permanent.addChild(text)

	Tween.fadeOut(text, 4000).then(() => {
		unsubscribe()
		Foreground.get().permanent.removeChild(text)
	})
}

const initialize = () => {
	Events.listen('save', create)
}

export default { initialize }