import UnitView from './unit'
import Foreground from '../../render/foreground'
import RenderView from '../../render/view'


const getName = unit => unit.expert ? unit.properties.name[unit.expert] || unit.properties.name.default : unit.properties.name.default

const initialize = () => {
	const unitName = new PIXI.Text('', {
		fontFamily: 'Times New Roman',
		fontSize: 32,
		fill: 0xffffff,
		align: 'center'
	})
	unitName.x = 10

	UnitView.listen.selectedView(view => {
		if (view) {
			unitName.text = `${getName(view.unit)}`
			Foreground.get().notifications.addChild(unitName)
		}

		return () => {
			Foreground.get().notifications.removeChild(unitName)
		}
	})

	RenderView.updateWhenResized(({ dimensions }) => {
		unitName.y = dimensions.y - 60
	})
}

export default { initialize }