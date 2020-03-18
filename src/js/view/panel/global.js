import Time from 'timeline/time'

import Treasure from 'entity/treasure'

import Foreground from 'render/foreground'
import Dom from 'render/dom'

import Hints from 'input/hints'

import Help from 'view/help'
import Europe from 'view/europe'

const initialize = () => {
	const { h, patch } = Dom
	let globalPanel = document.createElement('div')
	document.body.appendChild(globalPanel)
	const render = ({ screen, scale, treasure, time, help, hints, isMap }) => {

		const view = h('div', { class: { 'global-panel': true, isMap } }, [
			h('div', { on: { click: screen.click }, class: { click: true } }, screen.text),
			h('div', treasure.text),
			isMap && h('div', { on: { click: scale.click }, class: { click: true } }, scale.text),
			h('div', time.text),
			isMap && h('div', { on: { click: help.click }, class: { click: true } }, help.text),
			isMap && h('div.hints', hints.map(hint =>
				h('div', hint.text)))
		].filter(x => x))

		globalPanel = patch(globalPanel, view)
	}

	let bottomPanel = document.createElement('div')
	document.body.appendChild(bottomPanel)

	Foreground.listen.screen(screen => 
		Hints.listen(hints => {
			const view = h('div.bottom-panel', screen && screen.params.name === 'colony'
				? hints.map(hint => h('div', hint.text))
				: [])

			bottomPanel = patch(bottomPanel, view)
		}))

	// let centeredMessage = document.createElement('div')
	// document.body.appendChild(centeredMessage)
	// Time.listen.paused(paused => {
	// 	const view = h('div.centered-message', paused ? h('h1', 'Game paused') : [])
	// 	centeredMessage = patch(centeredMessage, view)
	// })

	Foreground.listen.screen(screen =>
		Time.listen.scale(scale =>
			Time.listen.paused(paused =>
				Time.listen.year(year =>
					Time.listen.month(month =>
						Hints.listen(hints =>
							Treasure.listen.amount(amount => {
								const isEurope = screen && screen.params.name === 'europe'
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
									},
									hints
								})
							})))))))
}

export default {
	initialize
}