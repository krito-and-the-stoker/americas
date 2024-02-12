import styles from './Grid.module.scss'


function Grid(props) {

	return <div class={styles.grid} style={{
		'grid-template-columns': `repeat(${props.columns}, auto)`
	}}>
		{props.children}
	</div>
}

export default Grid
