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
    {/* Will not close on click because styles set to pointer-events none */}
    <div class={styles.backdrop} onClick={ReactiveDialog.close}>
      <div class={styles.dialog} onClick={stopPropagation} onWheel={stopPropagation}>
        <div class={styles.content}>
          {render(ReactiveDialog.name(), ReactiveDialog.context)}
        </div>
      </div>
    </div>
  </Show>
}

export default Dialog
