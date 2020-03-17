import { init } from 'snabbdom'
import Class from 'snabbdom/modules/class'
import EventListeners from 'snabbdom/modules/eventlisteners'
import Style from 'snabbdom/modules/style'
import Render from 'snabbdom/h'

export const patch = init([ Class, Style, EventListeners ])
export const h = Render
