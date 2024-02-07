import { classList } from 'solid-js/web';
import Util from 'util/util'
import ReactiveDialog from 'ui/reactiveDialog'

import styles from './Answer.module.scss'

function Answer(props) {
	function handleClick() {
		Util.execute(props.action)
		ReactiveDialog.close()
	}

	return <a classList={{
		[styles.answer]: true, 
		[styles.disabled] : props.disabled
	}} onClick={handleClick}>{props.children}</a>
}

export default Answer
