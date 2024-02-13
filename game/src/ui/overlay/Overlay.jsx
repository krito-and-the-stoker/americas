import { Show } from 'solid-js'
import Overlay from 'ui/overlay'

import Global from './Global'
import Hints from './Hints'


function OverlayComponent() {
	return <Show when={Overlay.isVisible()}>
		<Global />
		<Hints />
	</Show>
}

export default OverlayComponent
