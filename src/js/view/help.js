import Ressources from '../render/ressources'
import Foreground from '../render/foreground'
import RenderView from '../render/view'
import Click from '../input/click'
import Wheel from '../input/wheel'
import Time from '../timeline/time'
import Events from '../view/ui/events'

const helpText = `AMERICAS by Krito and the Stoker


General commands:
Show help                  - h or click on Help
Pause game                 - Press space
Speed up game              - Press +
Slow down game             - Press -
Reset to normal speed      - Press 0
Show Europe screen         - Press e
Show America map           - Press a
Enter Colony screen        - Left click on colony
Leave current screen       - Press Escape

All units on the map:
Select unit                - Left click on unit
Move selected unit         - Right click on destination
Center map on unit         - Press c
Disband unit               - Press x

All Colonists on the map:
Build Colony              - Press b

All Pioneers on the map:
Cut down forest           - Press p
Plow field                - Press p
Build road                - Press r

In the colony:
Leave colony screen  - Press Escape or a or click on wood frame
Everything else here is pretty much click or drag and drop. We
tried to follow current standards and hope you will find yourself
around here easily.

In Europe:
Leave Europe screen  - Press Escape or a
Everything else is also mostly drag and drop as in colonies.

Saving the game:
We autosave your game periodically and right before you leave the
page. Your game is stored in your browser and you are offered to
resume when entering the page. You can close your browser and
restart the computer without losing the game. However, note that
we currently only save one game, so when you start a new game,
the old game is lost.`


const create = () => {
	const container = new PIXI.Container()
	const background = new PIXI.Sprite(new PIXI.Texture(Ressources.get().help))
	const originalDimensions = {
		x: 800,
		y: 575
	}

	const helpTextView = new PIXI.Text(helpText, {
		fontFamily: 'Courier',
		fontSize: 14,
		fill: 0xFFFFFF,
		align: 'left'
	})

	helpTextView.x = 100
	helpTextView.y = 100

	container.addChild(background)
	container.addChild(helpTextView)

	RenderView.updateWhenResized(({ dimensions }) => {
		const scale = {
			x: dimensions.x / originalDimensions.x,
			y: dimensions.y / originalDimensions.y,
		}
		const coverScale = Math.max(scale.x, scale.y)
		background.scale.set(coverScale)

		const fitScale = Math.min(scale.x, scale.y)
		helpTextView.scale.set(fitScale)
	})

	let position = 0
	Wheel.on(e => {
		if (isOpen) {		
			position += e.deltaY
			if (position < 0) {
				position = 0
			}
			if (position > 600) {
				position = 600
			}

			helpTextView.y = 100 - position
		}
	})

	Click.on(background, close)
	Events.listen('help', () => Time.resume())

	return container
}

let screen = null
const open = () => {
	if (!screen) {
		screen = create()
	}

	Foreground.openScreen(screen, { name: 'help' })
	Time.pause()
}

const close = () => {
	Time.resume()
	Foreground.closeScreen()
}


export default {
	open,
	close
}