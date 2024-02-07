import styles from './DialogImage.module.scss'

const images = {
	admiral: '/images/dialog-characters/admiral.png'
}

function Image(props) {
	const src = () => images[props.image]

	return <img class={styles.image} src={src()} />
}


export default Image