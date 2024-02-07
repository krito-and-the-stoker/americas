import { createResource, createEffect } from 'solid-js'
import styles from './Dialog.module.scss'

import ReactiveDialog from './reactiveDialog'

function Dialog() {
  const render = (name, context) => {
    if (ReactiveDialog.dialogs.loading) {
      return null
    }
    if (ReactiveDialog.dialogs.error) {
      console.error('error loading dialogs', dialogs.error)
      return null
    }

    const data = ReactiveDialog.dialogs()
    if (!data || ! data[name]) {
      return null
    }

    return data[name].render(context)
  }

  const stopPropagation = event => {
    event.stopPropagation()
  }

  return <Show when={ReactiveDialog.hasDialog(ReactiveDialog.name())}>
    <div class={styles.dimmer}>
      <div class={styles.dialog} onClick={stopPropagation} onWheel={stopPropagation}>
        <div class={styles.content}>
          {render(ReactiveDialog.name(), ReactiveDialog.context)}
        </div>
      </div>
    </div>
  </Show>
}

export default Dialog
