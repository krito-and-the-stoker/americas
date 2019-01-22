import UnitMapView from './unit'
import Foreground from '../../render/foreground'
import RenderView from '../../render/view'
import UnitView from '../unit'

const initialize = () => {
	const unitName = new PIXI.Text('', {
		fontFamily: 'Times New Roman',
		fontSize: 32,
		fill: 0xffffff,
		align: 'center'
	})
	unitName.x = 10

	UnitMapView.listen.selectedView(view => {
		if (view) {
			unitName.text = `${UnitView.getName(view.unit)}`
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