import type { ColonyEntity } from 'entity/colony'
import { Show, For } from 'solid-js'

import Util from 'util/util'

import Storage from 'entity/storage'
import Colony from 'entity/colony'
import Construction from 'entity/construction'

import Foreground from 'render/foreground'
import Signal from 'util/signal-ts'
import Dialog from 'view/ui/dialog'
import ProductionGoods from 'ui/components/ProductionGoods'
import StorageGoods from 'ui/components/StorageGoods'
import GameIcon from 'ui/components/GameIcon'

import styles from './DefaultSummary.module.scss'

function openConstructionDialog(colony:ColonyEntity) {
  const options = Construction.options(colony)

  const prepareOption = (option: any) => ({
    ...option,
    start: () => Construction.start(colony, option),
    percentage: Math.floor((100 * option.progress) / Util.sum(Object.values(option.cost))),
  })

	console.log(options)
  Dialog.open('colony.construction', {
    newBuildings: options.newBuildings.map(prepareOption),
    upgradeBuildings: options.upgradeBuildings.map(prepareOption),
    units: options.units.map(prepareOption),
    stop: () => Construction.start(colony, null)
  })
}

function DefaultSummary() {
	const colonyChain = Signal.chain(
		Foreground.listen.screen,
		Signal.select((screen: any) => screen?.params?.colony as ColonyEntity | undefined)
	)

	const colony = Signal.createSolid(
		colonyChain
	)

	const productionSummary = Signal.createSolid(
		colonyChain,
		Signal.select(colony => colony && colony.productionSummary),
		Storage.signal
	)

	const constructionChain = Signal.chain(
		colonyChain,
		Signal.select(colony => colony && Colony.currentConstruction(colony)),
	)
	const cost = Signal.createSolid(
		constructionChain,
		Signal.select(construction => construction?.cost)
	)

	const progressPercentage = Signal.createSolid(
		constructionChain,
		Signal.select(construction => {
			const costSum = Util.sum(Object.values(construction?.cost ?? {})) || 1
			return 100 * (construction?.progress ?? 0) / costSum
		})
	)

	const display = Signal.createSolid(
		constructionChain,
		Signal.select(construction => construction?.display)
	)

	const integrationChain = Signal.chain(
		colonyChain,
		Signal.assert.not.isNothing(
			Signal.combine(
				Signal.through(),
				Signal.key('bells'),
				Signal.key('colonists')
			),
			Signal.select(([colony]) => colony)
		),
	)
	const rebels = Signal.createSolid(
		integrationChain,
		Signal.select((colony) => !!colony && Colony.rebels(colony) || undefined)
	)
	const tories = Signal.createSolid(
		integrationChain,
		Signal.select((colony) => !!colony && Colony.tories(colony) || undefined)
	)

  const supportedUnits = Signal.createSolid(
  	colonyChain,
  	Signal.assert.not.isNothing(
	  	Signal.key('supportedUnits'),
	  	Signal.each(
	  		Signal.combine(
	  			Signal.through(),
	  			Signal.chain(
	  				Signal.key('colonist'),
	  				Signal.key('colony')
	  			),
	  			Signal.chain(
	  				Signal.select(unit => unit?.consumptionSummary),
	  				Storage.signal,
	  				Signal.select(storage => (!!storage && Util.sum(Storage.goods(storage).map(pack => pack.amount))) || 0)
	  			)
	  		),
	  		Signal.select(([unit, colony, consumption]) => ({ unit, show: !colony && consumption < 0 })),
	  	),
  	),
  	Signal.select(entries => entries?.filter(entry => entry.show).map(entry => entry.unit) ?? [])
  )

  const hasConstructors = Signal.createSolid(
  	colonyChain,
  	Signal.assert.not.isNothing(
	  	Signal.key('colonists'),
	  	Signal.each(
	  		Signal.key('work')
	  	),
  	),
  	Signal.select(
  		works => !!works && works.filter(
  			work => work.type === 'Building' && work.building?.name === 'carpenters'
			).length > 0
  	)
  )

	return <>
		<div class={styles.title}>Production and Consumption</div>
		<ProductionGoods goods={productionSummary()} sort={true} />
		<Show when={hasConstructors()}>
			<div class={styles.construction} onClick={() => openConstructionDialog(colony()!)}>
				<div class={styles.subtitle}>Construction</div>
				<Show when={display()} fallback={<i>None</i>}>
					<span><i>{display()}</i></span>
					<StorageGoods goods={cost()} />
					<span>{progressPercentage()?.toFixed(0)}%</span>
				</Show>
			</div>
		</Show>
		<div class={styles.colonists}>
			<div classList={{[styles.green]: rebels()?.percentage! >= 50}}>
				<i>Integrated</i> {rebels()?.percentage}% ({rebels()?.number} Colonists)
			</div>
			<div classList={{[styles.red]: tories()?.number! >= 10}}>
				<i>Unorganized</i> {tories()?.percentage}% ({tories()?.number} Colonists)
			</div>
		</div>
		<Show when={supportedUnits()?.length > 0}>
			<div class={styles.supportTitle}>Supported Units</div>
			<div class={styles.supported}>
				<For each={supportedUnits()!}>
					{unit => <GameIcon unit={unit} />}
				</For>
			</div>
		</Show>
	</>
}

export default DefaultSummary