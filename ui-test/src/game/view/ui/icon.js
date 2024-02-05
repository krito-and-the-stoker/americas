import Icons from 'data/icons.json'
import Resources from 'render/resources'
import Dom from 'render/dom'

const create = name => Resources.sprite('map', { frame: Icons[name] })
const html = (name, scale = 1) => Dom.sprite('map', Icons[name], scale)

export default {
  create,
  html,
}
