import styles from './DialogImage.module.scss'

const images = {
	admiral: '/images/dialog-characters/admiral.png',
	govenor: '/images/dialog-characters/govenor.png',
	marshal: '/images/dialog-characters/marshal.png',
	religion: '/images/dialog-characters/religion.png',
	scout: '/images/dialog-characters/scout.png',

	king_james: '/images/dialog-characters/king-james.png',

	native1: '/images/characters-head/native1.png',
	native2: '/images/characters-head/native2.png',
	native3: '/images/characters-head/native3.png',
	native4: '/images/characters-head/native4.png',
	native5: '/images/characters-head/native5.png',
	native6: '/images/characters-head/native6.png',
	native7: '/images/characters-head/native7.png',
	native8: '/images/characters-head/native8.png',
	native9: '/images/characters-head/native9.png',
	native10: '/images/characters-head/native10.png',
}

const positioning = {
	left: ['admiral', 'govenor', 'marshal', 'religion', 'scout'],
	right: ['king_james'],
	top: [
		'native1',
		'native2',
		'native3',
		'native4',
		'native5',
		'native6',
		'native7',
		'native8',
		'native9',
		'native10',
	]
}

function Image(props) {
	const src = () => images[props.image]
	const classList = () => {
		const result = {
			[styles.image]: true,
		}
		const positionClass = Object.entries(positioning).find(([pos, images]) => images.includes(props.image))
		if (positionClass) {
			result[styles[positionClass[0]]] = true
		}

		return result
	}
		

	return <img classList={classList()} src={src()} />
}


export default Image
