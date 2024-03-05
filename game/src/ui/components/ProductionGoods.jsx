import GameIcon from './GameIcon'

import styles from './ProductionGoods.module.scss'

function ProductionGoods(props) {
	const filtered = () => Object.entries(props?.goods || {})
		.filter(([_, amount ]) => amount > 0 || amount < 0)
	const sorted = () => filtered().sort((a, b) => b[1] - a[1])
	const keys = () => props.sort
		? sorted().map(([good, amount]) => good)
		: filtered().map(([good, amount]) => good)

	const scale = () => props.scale ? 1.2 * props.scale : 1.2

	return <div class={styles.main}>
		<For each={keys()}>
			{good => <span classList={{[styles.red]: props.goods[good] < 0, [styles.entry]: true}}>
				<For each={Array(Math.min(20, Math.abs(Math.round(props.goods[good])))).fill()}>
					{() =>
						<span class={styles.good} style={{ 'margin-right': `-${Math.round(20 / scale())}px` }}>
							<GameIcon good={good} scale={scale()} />
						</span>
					}
				</For>
				<Show when={Math.abs(Math.round(props.goods[good])) > 4}><span class={styles.number}>
					{Math.round(props.goods[good])}
				</span></Show>
			</span>}
		</For>
	</div>
}

export default ProductionGoods
