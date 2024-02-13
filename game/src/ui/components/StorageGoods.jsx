import GameIcon from './GameIcon'

function StorageGoods(props) {
	const list = () => Object.entries(props.goods)
		.map(([good, amount]) => ({ good, amount }))

	return <For each={list()}>
		{good => <>
			{good.amount}<GameIcon name={good.good} />
		</>}
	</For>
}

export default StorageGoods
