/* @refresh reload */
import { render } from 'solid-js/web'

import 'entries/index.js'
import Main from './ui/Main'

const root = document.getElementById('ui-root')

render(() => <Main />, root)
