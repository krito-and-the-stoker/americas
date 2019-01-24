import Drag from 'input/drag'
import UnitView from 'view/unit'
import Text from 'render/text'


const create = originalDimensions => {
	const container = new PIXI.Container()
	const text = Text.create()
	text.x = 20
	text.y = originalDimensions.y

	const unsubscribeDrag = Drag.listen(params => {
		if (params) {
			if (params.unit) {
				text.text = UnitView.getName(params.unit)
			}
			if (params.colonist) {
				text.text = UnitView.getName(params.colonist.unit)
			}
			if (params.good) {
				text.text = `${params.amount} ${params.good}`
			}
			container.addChild(text)
		}

		return () => {
			container.removeChild(text)
		}
	})

	const unsubscribe = () => {
		unsubscribeDrag()
	}

	return {
		container,
		unsubscribe
	}
}


export default { create }