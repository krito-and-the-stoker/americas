import Util from 'util/util'
import ReactiveDialog from 'ui/reactiveDialog'

import styles from './Backdrop.module.scss'


function Backdrop(props) {
	const handleClick = () => {
		if (Util.isFunction(props.action)) {
			props.action()
		}

		ReactiveDialog.close()
	}

	return <div onClick={handleClick} class={styles.backdrop} />
}

export default Backdrop