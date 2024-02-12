import styles from './CoordinatesLink.module.scss'


function CoordinatesLink(props) {

	return <a class={styles.link} onClick={() => props.centerFn(props.coordinates)}>
		View
	</a>
}

export default CoordinatesLink