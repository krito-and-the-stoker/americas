import Icons from 'data/icons.json'
import Resources from 'render/resources'


const create = name => Resources.sprite('map', {frame: Icons[name] })

export default {
	create
}