import Goods from 'data/goods.json'
import Icons from 'data/icons.json'
import Resources from 'render/resources'

const good = name => Goods[name]?.id
const icon = name => Icons[name]
const unit = unit => unit.expert
  ? unit.properties.frame[unit.expert] || unit.properties.frame.default
  : unit.properties.frame.default


function GameIcon(props) {
  const url = () => Resources.paths['map']
  const frame = () => {
  	if (props.good) {
  		return good(props.good)
  	}
  	if (props.icon) {
  		return icon(props.icon)
  	}
  	if (props.unit) {
  		return unit(props.unit)
  	}
  	if (props.name) {
  		console.warn('Name property is deprecated for GameIcon, use good instead.')
  		return good(props.name)
  	}

  	console.log('No valid property found for GameIcon', props)
  }
  const rect = () => Resources.rectangle(frame())

  const background = () => `url(/${url()}) -${rect().x}px -${rect().y}px`
  const width = () => `${rect().width}px`
  const height = () => `${rect().width}px`
  const transform = () => `scale(${0.5 * (props.scale ?? 1)})`

	return <Show when={frame()}>
		<span style={{
			display: 'inline-block',
			background: background(),
			width: width(),
			height: height(),
			transform: transform(),
			margin: '-24px -16px',
		}} />
	</Show>
}

export default GameIcon
