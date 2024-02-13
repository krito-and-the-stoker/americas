import Time from 'timeline/time'

import Treasure from 'entity/treasure'

import Foreground from 'render/foreground'
import Dom from 'render/dom'

import Hints from 'input/hints'
import Drag from 'input/drag'

import Help from 'view/help'
import Europe from 'view/europe'
import MapView from 'view/map'
import UnitScreen from 'view/screen/units'
import ColonyScreen from 'view/screen/colonies'

const initialize = () => {
  console.log('initialize global panel')
  return null

  const { h, patch } = Dom
  let globalPanel = document.createElement('div')
  document.body.appendChild(globalPanel)
  const render = ({ screen, scale, treasure, time, help, map, hints, isMap }) => {
    const view = h(
      'div',
      { class: { 'global-panel': true, isMap } },
      [
        h('div', { on: { click: screen.click }, class: { click: true } }, screen.text),
        h('div', treasure.text),
        isMap && h('div', { on: { click: scale.click }, class: { click: true } }, scale.text),
        h('div', time.text),
        isMap && h('div', { on: { click: help.click }, class: { click: true } }, help.text),
        isMap &&
          h('div.map', [
            h('div.map-title', 'Map Options'),
            h(
              'div.support',
              {
                on: { click: map.support.click },
                class: { click: true },
              },
              map.support.text
            ),
            h(
              'div.forest',
              {
                on: { click: map.forest.click },
                class: { click: true },
              },
              map.forest.text
            ),
          ]),
        isMap &&
          h('div.screens', [
            h(
              'div.units',
              {
                on: { click: UnitScreen.open },
                class: { click: true },
              },
              'Open Unit Screen'
            ),
            h(
              'div.colonies',
              {
                on: { click: ColonyScreen.open },
                class: { click: true },
              },
              'Open Colony Screen'
            ),
          ]),
        isMap &&
          h(
            'div.hints',
            hints.filter(hint => hint.action === 'click').map(hint => h('div', hint.text))
          ),
      ].filter(x => x)
    )

    globalPanel = patch(globalPanel, view)
  }

  let bottomPanel = document.createElement('div')
  document.body.appendChild(bottomPanel)

  const formatHint = hint =>
    ({
      drag: 'Drag: ',
      release: '',
      click: 'Click: ',
    })[hint.action] + hint.text
  Foreground.listen.screen(
    screen =>
      screen &&
      screen.params.name === 'colony' &&
      Drag.listen(current =>
        current
          ? Hints.listen(hints => {
              const view = h(
                'div.bottom-panel',
                hints
                  .filter(hint => hint.action === 'release')
                  .map(hint => h('div', formatHint(hint)))
              )

              bottomPanel = patch(bottomPanel, view)
            })
          : Hints.listen(hints => {
              const view = h(
                'div.bottom-panel',
                hints
                  .filter(hint => hint.action !== 'release')
                  .map(hint => h('div', formatHint(hint)))
              )

              bottomPanel = patch(bottomPanel, view)
            })
      )
  )

  // let centeredMessage = document.createElement('div')
  // document.body.appendChild(centeredMessage)
  // Time.listen.paused(paused => {
  // 	const view = h('div.centered-message', paused ? h('h1', 'Game paused') : [])
  // 	centeredMessage = patch(centeredMessage, view)
  // })

  Foreground.listen.screen(screen =>
    MapView.listen.supportOverlayColoring(supportOverlayColoring =>
      MapView.listen.forestVisibility(forestVisibility =>
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
                        click: isEurope ? Europe.close : Europe.open,
                      },
                      treasure: {
                        text: `Treasure: ${Math.floor(amount)}`,
                      },
                      scale: {
                        text: paused ? 'Game paused' : `Gamespeed: ${scale.toFixed(2)}`,
                        click: Time.togglePause,
                      },
                      time: {
                        text: `${month} ${year} A.D.`,
                      },
                      help: {
                        text: 'Help',
                        click: Help.open,
                      },
                      map: {
                        support: {
                          click: MapView.toggleSupportOverlay,
                          text: supportOverlayColoring ? 'Hide supply' : 'Show supply',
                        },
                        forest: {
                          click: MapView.toggleForestVisibility,
                          text: forestVisibility ? 'Hide forest' : 'Show forest',
                        },
                      },
                      hints,
                    })
                  })
                )
              )
            )
          )
        )
      )
    )
  )
}

export default {
  initialize,
}
