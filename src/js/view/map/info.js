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

				const storage = unit.properties.cargo > 0 ? unit.storage : unit.equipment
				const unsubscribeStorage = Storage.listen(storage, storage => {
					const goods = Storage.goods(storage).filter(pack => pack.amount > 0)
					let storageIndex = 0

					return Util.mergeFunctions(goods.map(pack => {
						const view = GoodsView.create(pack)
						const offset = index * cargoScale * 32 + (index > 0 ? 20 : 0)
						view.sprite.x = offset + storageIndex * cargoScale * 95 + 5 + 0.25 * view.number.width
						view.sprite.y = 0
						view.sprite.scale.set(cargoScale)
						view.number.x = offset + storageIndex * cargoScale * 95
						view.number.y = 10
						view.number.scale.set(cargoScale)

						storageIndex += 1

						container.addChild(view.number)
						container.addChild(view.sprite)

						return () => {
							container.removeChild(view.number)
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