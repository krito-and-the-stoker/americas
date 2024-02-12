import { Show } from 'solid-js'
import Overlay from 'ui/overlay'

import Global from './Global'


function OverlayComponent() {
	return <Show when={Overlay.isVisible()}>
		<Global />
	</Show>
}

export default OverlayComponent
