import Util from 'util/util'
import Events from 'util/events'

import Time from 'timeline/time'

import Click from 'input/click'
import Drag from 'input/drag'

import Dom from 'render/dom'
import Foreground from 'render/foreground'

import GoodsView from 'view/goods'
import MapView from 'view/map'


const padding = 40
const emptyLine = 26
const clickBlockTime = 300

const left = {
	align: 'left',
	width: 0.25,
	centerMap: {
		x: 0.7,
		y: 0.5
	},
	closeScreen: true
}

const right = {
	align: 'right',
	width: 0.25,
	centerMap: {
		x: 0.3,
		y: 0.5
	},
	closeScreen: true
}

const broadLeft = {
	align: 'broadLeft',
	width: 0.45,
	centerMap: {
		x: 0.7,
		y: 0.5,
	},
	imageBehindText: true,	
}

const types = {
	menu: {
		align: 'center',
		pause: false,
		width: 0.4
	},
	naval: {
		...left,
		image: 'admiral',
	},
	king: {
		...right,
		image: 'kingJames',
	},
	scout: {
		...left,
		image: 'scout',
	},
	natives: {
		...broadLeft,
	},
	religion: {
		...left,
		image: 'religion',
	},
	marshal: {
		...left,
		image: 'marshal'
	},
	govenor: {
		...left,
		image: 'govenor'
	},
	notification: {
		align: 'center',
		width: 0.4,
		closeScreen: true
	}
}


const align = {
	center: (plane, image, dimensions) => {
		plane.x = dimensions.x / 2 - plane.width / 2
		plane.y = dimensions.y / 2 - plane.height / 2
	},
	left: (plane, image, dimensions) => {
		plane.x = dimensions.x / 2 - plane.width
		plane.y = dimensions.y / 2 - plane.height / 2
		if (image) {
			const width = 3 * dimensions.x / 12
			const height = width
			image.width = width
			image.height = height
			image.x = 0.25 * dimensions.x - 0.75 * width
			image.y = 0.5 * dimensions.y - 0.5 * height
		}
	},
	right: (plane, image, dimensions) => {
		plane.x = dimensions.x / 2
		plane.y = dimensions.y / 2 - plane.height / 2
		if (image) {
			const width = 3 * dimensions.x / 12
			const height = width
			image.width = width
			image.height = height
			image.x = 0.75 * dimensions.x - 0.25 * width
			image.y = 0.5 * dimensions.y - 0.5 * height
		}
	},
	broadLeft: (plane, image, dimensions) => {
		const width = 0.5 * 0.45 * dimensions.x
		const height = 4 * width / 5
		plane.x = 0.025 * dimensions.x
		plane.y = dimensions.y / 2 - width / 3
		if (image) {
			image.width = width
			image.height = height
			image.x = dimensions.x / 4 - width / 2
			image.y = dimensions.y / 2 - height - width / 3 + 10
		}
	}
}

const { h, patch } = Dom
const tags = {
	spacer: {
		begin: '<\\|',
		end: '\\|>',
		replace: (content, parse) => h('div.spacer', content.split('<->').map(chunk =>
			h('div', parse(chunk))))
	},
	options: {
		begin: '<options',
		end: '/>',
		replace: (content, parse, context) => h('div.options', context.options.map(({ text, action, disabled, margin }) =>
			h('div.option', {
				class: { disabled, margin, option: true },
				on: {
					click: () => {
						if (!disabled) {
							context.actionTaken = true
							Util.execute(action)
						}
					}
				}
			}, parse(text))
		))
	},
	bold: {
		begin: '\\*\\*',
		end:'\\*\\*',
		replace: (content, parse) => h('b', parse(content))
	},
	italic: {
		begin: '\\*',
		end:'\\*',
		replace: (content, parse) => h('i', parse(content))
	},
	underlined: {
		begin: '_',
		end: '_',
		replace: (content, parse) => h('span.underlined', parse(content))
	},
	good: {
		begin: '<good>',
		end: '</good>',
		replace: content => h('span.good', GoodsView.html(content, 0.4))
	},
}

const tagExpOuter = tag => `(${tag.begin}.*?${tag.end})`
const tagExpInner = tag => `${tag.begin}(.*?)${tag.end}`
const splitRegex = new RegExp(Object.values(tags).map(tagExpOuter).join('|'))

const create = context => {
	const { type, text, options, coords, pause, closeScreen, centerMap, image } = context
	const config = {
		...types[type],
	}

	if (typeof closeScreen !== 'undefined') {
		config.closeScreen = closeScreen
	}
	if (typeof centerMap !== 'undefined') {
		config.centerMap = centerMap
	}
	if (typeof image !== 'undefined') {
		config.image = image
	}

	if (coords && config.centerMap) {
		MapView.centerAt(coords, 500, config.centerMap)
	}

	if (pause) {
		Time.pause()
	}

	if (config.closeScreen) {
		Foreground.closeScreen()
	}

	const tagReplace = chunk => {
		const tag = Object.values(tags).find(t => chunk.match(new RegExp(tagExpInner(t))))
		if (tag) {
			const match = chunk.match(new RegExp(tagExpInner(tag)))[1]
			return tag.replace(match, parse, context)
		}

		return chunk
	}
	const parse = text => text.split(splitRegex).filter(x => !!x).map(tagReplace)
	context.parse = parse


	let el = document.createElement('div.dialog')
	document.body.appendChild(el)
	let isOpen = true

	const close = () => {
		isOpen = false
		render()

		if (options && !context.actionTaken) {
			const defaultAction = options.find(option => option.default)?.action
			Util.execute(defaultAction)
		}

		if (pause) {
			Time.resume()
		}
	}

	const render = () => {
		if (isOpen) {
			el = patch(el, h('div', {
				class: {
					dialog: true
				},
				on: {
					click: close
				}
			}, [
				h('div.background', [
					h('div.content', [
						h('div', parse(text))
					])
				])
			]))
		} else {
			patch(el, h('!'))
		}
	}

	render()

	return close
}

const initialize = () => {
	Events.listen('dialog', params => create(params))
}

export default {
	initialize,
	create
}