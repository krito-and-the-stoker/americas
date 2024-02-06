import { createResource, createEffect } from 'solid-js'
import { fetchDialogs } from './templates'
import styles from './Dialog.module.scss'

function Dialog(props) {
  const [dialogs] = createResource(fetchDialogs)
  const render = (name, context) => {
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

    return data[name].render(context)
  }
  const hasName = () => !!props.name && !!dialogs() && !!dialogs()[props.name]
  createEffect(() => {
    if (props.name && dialogs() && !dialogs()[props.name]) {
      console.error('Dialog not found', props.name, '\nThese dialogs are valid:', Object.keys(dialogs()))
    }
  })

  return <Show when={hasName()}>
    <div class={styles.backdrop}>
      <div class={styles.dialog}>
        {render(props.name, props.context)}
      </div>
    </div>
  </Show>
}

export default Dialog
