import * as PIXI from 'pixi.js'

import Events from 'util/events'

import Time from 'timeline/time'

import Click from 'input/click'
import Drag from 'input/drag'

import Foreground from 'render/foreground'
import RenderView from 'render/view'
import Text from 'render/text'
import Resources from 'render/resources'

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



const create = ({ type, text, options, coords, pause, closeScreen, centerMap, image }) => {
	let clickAllowed = false
	setTimeout(() => { clickAllowed = true }, clickBlockTime)

	const closePlane = new PIXI.Container()
	const plane9 = new PIXI.mesh.NineSlicePlane(Resources.texture('status'), 100, 100, 100, 100)
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

	const textView = Text.create(text)
	textView.y = padding
	plane9.addChild(textView)

	const imageView = config.image ? Resources.sprite(config.image) : null

	const optionViews = (options ? options.filter(option => option.text) : []).map(option => ({
		...option,
		text: Text.create(option.text)
	}))

	if (coords && config.centerMap) {
		MapView.centerAt(coords, 500, config.centerMap)
	}

	optionViews.forEach(option => {
		if (!option.disabled) {		
			Click.on(option.text, () => {
				if (clickAllowed) {
					if (option.action) {
						option.action()
					}
					close()
				}
			})
			option.text.buttonMode = true
		}
		plane9.addChild(option.text)
	})

	const unsubscribeDimensions = RenderView.listen.dimensions(dimensions => {
		closePlane.hitArea = new PIXI.Rectangle(0, 0, dimensions.x, dimensions.y)

		let currentHeight = padding
		textView.style = {
			...textView.style,
			wordWrap: true,
			wordWrapWidth: config.width * dimensions.x
		}
		textView.x = padding + (config.width * dimensions.x - textView.width) / 2
		currentHeight += textView.height + emptyLine

		optionViews.forEach(option => {
			if (option.disabled) {
				option.text.style = {
					...textView.style,
					fill: 0xDDCCBB
				}
			} else {
				option.text.style = textView.style
			}
			option.text.x = padding + (config.width * dimensions.x - option.text.width) / 2
			if (option.margin) {
				currentHeight += emptyLine
			}
			option.text.y = currentHeight
			currentHeight += option.text.height
		})

		plane9.width = config.width * dimensions.x + 2*padding
		plane9.height = currentHeight + padding
		align[config.align](plane9, imageView, dimensions)
	})

	Drag.waitForDrag().then(() => {
		if (config.closeScreen) {
			Foreground.closeScreen()
		}

		Foreground.add.dialog(closePlane)
		if (imageView && config.imageBehindText) {
			Foreground.add.dialog(imageView)
		}
		Foreground.add.dialog(plane9)
		if (imageView && !config.imageBehindText) {
			Foreground.add.dialog(imageView)
		}

		if (pause) {
			Time.pause()
		}
	})

	const close = () => {
		unsubscribeDimensions()
		unsubscribeClick()
		Foreground.remove.dialog(closePlane)
		Foreground.remove.dialog(plane9)
		if (imageView) {	
			Foreground.remove.dialog(imageView)
		}
		if (pause) {
			Time.resume()
		}
	}

	const unsubscribeClick = Click.on(closePlane, () => {
		if (clickAllowed) {
			const defaultOption = options ? options.find(option => option.default) : null
			if (defaultOption && defaultOption.action) {
				defaultOption.action()
			}
			close()
		}
	})

	return close
}

const initialize = () => {
	Events.listen('dialog', params => create(params))
}

export default {
	initialize,
	create
}