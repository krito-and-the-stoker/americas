import UnitMapView from './unit'
import Foreground from '../../render/foreground'
import RenderView from '../../render/view'
import UnitView from '../unit'
import Unit from '../../entity/unit'
import Util from '../../util/util'
import Storage from '../../entity/storage'
import GoodsView from '../../view/goods'

const cargoScale = .6

const initialize = () => {
	const unitName = new PIXI.Text('', {
		fontFamily: 'Times New Roman',
		fontSize: 32,
		fill: 0xffffff,
		align: 'center'
	})
	unitName.x = 10

	const container = new PIXI.Container()
	container.x = 10

	const greyScaleFilter = new PIXI.filters.ColorMatrixFilter()
	greyScaleFilter.blackAndWhite()

	UnitMapView.listen.selectedView(view => {
		if (view) {
			const unit = view.unit
			unitName.text = `${UnitView.getName(unit)}`

			Foreground.get().notifications.addChild(unitName)
			Foreground.get().notifications.addChild(container)

			const unsubscribePassengersAndStorage = Unit.listen.passengers(unit, passengers => {
				let index = 0
				const unsubscribePassengers = Util.mergeFunctions(passengers.map(passenger => {
					const sprite = UnitView.create(passenger)
					sprite.x = index * cargoScale * 32 - 8
					sprite.y = 0
					sprite.scale.set(cargoScale)
					container.addChild(sprite)

					index += 1
	
					return () => {
						container.removeChild(sprite)
					}
				}))

				const unsubscribeStorage = Storage.listen(unit.storage, storage => {
					const goods = Storage.split(unit.storage)
					let storageIndex = index

					return Util.mergeFunctions(goods.map(pack => {
						const view = GoodsView.create(pack)
						view.sprite.x = storageIndex * cargoScale * 32 - 8
						view.sprite.y = 0
						view.sprite.scale.set(cargoScale)
						if (pack.amount < 100) {
							view.sprite.filters = [greyScaleFilter]
						}
						storageIndex += 1

						container.addChild(view.sprite)

						return () => {
							container.removeChild(view.sprite)
						}
					}))
				})

				return () => {
					unsubscribePassengers()
					unsubscribeStorage()
				}
			})

			return () => {
				Foreground.get().notifications.removeChild(unitName)
				Foreground.get().notifications.removeChild(container)
				unsubscribePassengersAndStorage()
			}
		}
	})

	RenderView.updateWhenResized(({ dimensions }) => {
		unitName.y = dimensions.y - 100
		container.y = dimensions.y - 60
	})
}

export default { initialize }