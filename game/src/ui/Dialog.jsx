import { createResource, createEffect } from 'solid-js'
import styles from './Dialog.module.scss'

import ReactiveDialog from './reactiveDialog'

function Dialog() {
  const reactiveDialog = ReactiveDialog.getInstance()
  const render = (name, context) => {
    if (reactiveDialog.dialogs.loading) {
      return null
    }
    if (reactiveDialog.dialogs.error) {
      console.error('error loading dialogs', dialogs.error)
      return null
    }

    const data = reactiveDialog.dialogs()
    if (!data || ! data[name]) {
      return null
    }

    return data[name].render(context)
  }

  const stopPropagation = event => {
    event.stopPropagation()
  }

  return <Show when={reactiveDialog.hasDialog(reactiveDialog.name())}>
    <div class={styles.dimmer}>
      <div class={styles.dialog} onClick={stopPropagation} onWheel={stopPropagation}>
        <div class={styles.content}>
          {render(reactiveDialog.name(), reactiveDialog.context)}
        </div>
      </div>
    </div>
  </Show>
}

export default Dialog
