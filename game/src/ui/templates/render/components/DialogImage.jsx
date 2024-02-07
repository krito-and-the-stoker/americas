import styles from './DialogImage.module.scss'

const images = {
	admiral: '/images/dialog-characters/admiral.png',
	govenor: '/images/dialog-characters/govenor.png',
	king_james: '/images/dialog-characters/king-james.png',
	marshal: '/images/dialog-characters/marshal.png',
	religion: '/images/dialog-characters/religion.png',
	scout: '/images/dialog-characters/scout.png',
}

function Image(props) {
	const src = () => images[props.image]

	return <img class={styles.image} src={src()} />
}


export default Image
