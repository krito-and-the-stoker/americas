import { createResource, createEffect } from 'solid-js'

import 'entries/index.js'
import { fetchDialogs } from './templates'
import styles from './Main.module.scss'

function Main() {
  const [dialogs] = createResource(fetchDialogs)
  const dialog = (name, context) => {
    if (dialogs.loading) {
      return null
    }
    if (dialogs.error) {
      console.error('error loading dialogs', dialogs.error)
      return null
    }

    const data = dialogs()
    if (!data || ! data[name]) {
      return null
    }

    return data[name](context)
  }

  return <>
    <div class={styles.main}>
      <h1>This is the UI</h1>
      {dialog('simple', { greeting: 'Welt' })}
    </div>
  </>
}

export default Main
