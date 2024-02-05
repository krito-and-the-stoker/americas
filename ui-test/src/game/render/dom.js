import { init } from 'snabbdom'
import Class from 'snabbdom/modules/class'
import EventListeners from 'snabbdom/modules/eventlisteners'
import Style from 'snabbdom/modules/style'
import Render from 'snabbdom/h'

import Resources from 'render/resources'

const patch = init([ Class, Style, EventListeners ])
const h = Render

const sprite = (image, frame = 0, scale = 1, options = {}) => {
	const rect = Resources.rectangle(frame)
	const url = Resources.paths[image]

	return h('span', {
		class: {
			icon: true,
		},
		style: {
			display: 'inline-block',
			background: `url(/${url}) -${rect.x}px -${rect.y}px`,
			width: `${rect.width}px`,
			height: `${rect.width}px`,
			transform: `scale(${scale})`
		},
		...options
	})
}
export default {
	patch,
	h,
	sprite
}