import GameIcon from './GameIcon'

import styles from './ProductionGoods.module.scss'

function ProductionGoods(props) {
	const keys = () => Object.entries(props?.goods || {})
		.filter(([_, amount ]) => amount >= 1 || amount <= -1)
		.sort((a, b) => b[1] - a[1])
		.map(([good, amount]) => good)

	return <div class={styles.main}>
		<For each={keys()}>
			{good => <span classList={{[styles.red]: props.goods[good] < 0, [styles.entry]: true}}>
				<For each={Array(Math.min(20, Math.abs(Math.ceil(props.goods[good])))).fill()}>{() => <span class={styles.good}><GameIcon good={good} scale={1.2} /></span>}</For>
				<Show when={Math.abs(Math.ceil(props.goods[good])) > 5}><span class={styles.number}>
					{Math.ceil(props.goods[good])}
				</span></Show>
			</span>}
		</For>
	</div>
}

export default ProductionGoods
