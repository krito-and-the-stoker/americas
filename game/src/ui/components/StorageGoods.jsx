import GameIcon from './GameIcon'

function StorageGoods(props) {
	const keys = () => Object.entries(props?.goods || {})
		.filter(([_, amount ]) => amount > 0)
		.map(([good, amount]) => good)

	return <For each={keys()}>
		{good => <>
			{Math.ceil(props.goods[good])}<GameIcon name={good} />
		</>}
	</For>
}

export default StorageGoods
