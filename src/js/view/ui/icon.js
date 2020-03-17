import Icons from 'data/icons.json'
import Resources from 'render/resources'
import { h } from 'util/virtualDom'


const create = name => Resources.sprite('map', { frame: Icons[name] })
const html = (name, scale = 1) => {
	const rect = Resources.rectangle(Icons[name])
	return h('span', {
		class: {
			icon: true,
			[name]: true
		},
		style: {
			display: 'inline-block',
			background: `url(/images/map.png) -${rect.x}px -${rect.y}px`,
			width: `${rect.width}px`,
			height: `${rect.width}px`,
			transform: `scale(${scale})`
		}
	})
}

export default {
	create,
	html
}