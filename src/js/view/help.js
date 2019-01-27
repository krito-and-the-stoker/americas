import Resources from 'render/resources'
import Foreground from 'render/foreground'
import RenderView from 'render/view'
import Click from 'input/click'
import Wheel from 'input/wheel'
import Time from 'timeline/time'
import Events from 'view/ui/events'
import Binding from 'util/binding'
import Text from 'render/text'


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
Show/hide forest on map    - Press f

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

Trade routes:
Click on a good in the colony storage to toggle between import, export and no trade.
Trading ships and wagon trains will come and match your goods as good as they can.
Ships and wagon trains    - Press t


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

const help = {
	position: 0
}

const update = {
	position: value => Binding.update(help, 'position', value)
}

const listen = {
	position: fn => Binding.listen(help, 'position', fn)
}

const create = () => {
	const container = new PIXI.Container()
	const background = Resources.sprite('help')
	const originalDimensions = {
		x: 800,
		y: 575
	}

	const helpTextView = Text.create(helpText, {
		fontFamily: 'Courier',
		fontSize: 14,
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

	listen.position(position => {
		if (position < 0) {
			update.position(0)
			return
		}
		if (position > 600) {
			update.position(600)
			return
		}

		helpTextView.y = 100 - position
	})

	Wheel.on(e => {
		update.position(help.position + e.deltaY)
	})

	Click.on(background, close)

	const unsubscribe = () => {
		Time.resume()		
	}

	return {
		container,
		unsubscribe
	}
}

let screen = null
const open = () => {
	if (!screen) {
		screen = create()
	}

	update.position(0)
	Foreground.openScreen(screen, { name: 'help' })
	Time.pause()
}

export default {
	open,
}