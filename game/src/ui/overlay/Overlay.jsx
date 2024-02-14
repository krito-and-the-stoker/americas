import { Show } from 'solid-js'
import Overlay from 'ui/overlay'

import Global from './Global'
import Unit from './Unit'
import Hints from './Hints'
import Colony from './Colony'


function OverlayComponent() {
	return <Show when={Overlay.isVisible()}>
		<Colony />
		<Global />
		<Unit />
		<Hints />
	</Show>
}

export default OverlayComponent
