import Goods from 'data/goods.json'
import Resources from 'render/resources'

const frame = name => Goods[name].id

function GameIcon(props) {
  const url = () => Resources.paths['map']
  const rect = () => Resources.rectangle(frame(props.name))

  const background = () => `url(/${url()}) -${rect().x}px -${rect().y}px`
  const width = () => `${rect().width}px`
  const height = () => `${rect().width}px`
  const transform = () => `scale(${0.5 * (props.scale ?? 1)})`

	return <span style={{
		display: 'inline-block',
		background: background(),
		width: width(),
		height: height(),
		transform: transform(),
		margin: '-24px -16px',
	}} />
}

export default GameIcon
