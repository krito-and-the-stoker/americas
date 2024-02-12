import { Show } from 'solid-js'
import Overlay from 'ui/overlay'
import style from './Global.module.scss'

import Binding from 'ui/binding'
import Treasure from 'entity/treasure'

function Global() {
	const [treasure, setTreasure] = Binding.create(
		Treasure.listen.amount,
		Treasure.update.amount
	)

	return <Show when={Overlay.isVisible()}>
		<div class={style.main}>
			We have {Math.round(treasure())} Gold.
			<br /><button onClick={() => setTreasure(x => x + 10)}>more</button>
		</div>
	</Show>
}

export default Global
