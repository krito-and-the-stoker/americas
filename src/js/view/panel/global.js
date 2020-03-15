import { init } from 'snabbdom'
import Class from 'snabbdom/modules/class'
import EventListeners from 'snabbdom/modules/eventlisteners'
import Render from 'snabbdom/h'

import Time from 'timeline/time'

import Treasure from 'entity/treasure'


import RenderView from 'render/view'
import Foreground from 'render/foreground'

import Help from 'view/help'
import Europe from 'view/europe'

const initialize = () => {
	const patch = init([ Class, EventListeners ])
	const h = Render

	let globalPanel = document.createElement('div')
	document.body.appendChild(globalPanel)

	const render = ({ screen, scale, treasure, time, help, isMap }) => {
		const view = h('div', { class: { 'global-panel': true, isMap } }, [
			isMap && h('div', { on: { click: screen.click }, class: { click: true } }, screen.text),
			h('div', treasure.text),
			isMap && h('div', { on: { click: scale.click }, class: { click: true } }, scale.text),
			h('div', time.text),
			isMap && h('div', { on: { click: help.click }, class: { click: true } }, help.text)
		].filter(x => x))

		globalPanel = patch(globalPanel, view)
	}

	Foreground.listen.screen(screen =>
		Time.listen.scale(scale =>
			Time.listen.paused(paused =>
				Time.listen.year(year =>
					Time.listen.month(month =>
						Treasure.listen.amount(amount => {
							const isEurope = screen && screen.params.name === 'europe'
							console.log(screen)
							render({
								isMap: screen === null,
								screen: {
									text: isEurope ? 'Americas' : 'London',
									click: isEurope ? Europe.close : Europe.open
								},
								treasure: {
									text: `Treasure: ${Math.floor(amount)}`
								},
								scale: {
									text: paused ? 'Game paused' : `Gamespeed: ${scale.toFixed(2)}`,
									click: Time.togglePause
								},
								time: {
									text: `${month} ${year} A.D.`
								},
								help: {
									text: 'Help',
									click: Help.open
								}
							})
						}))))))
}

export default {
	initialize
}