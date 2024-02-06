import { createSignal } from 'solid-js'

import Dialog from './Dialog'

import styles from './Main.module.scss'

function registerDialogFunctions (setName, setContext) {
  window.openDialog = (name, context = {}) => {
    setContext(context)
    setName(name)
  }
  window.closeDialog = () => setName('')
}

function Main() {
  const [name, setName] = createSignal('')
  const [context, setContext] = createSignal({})
  registerDialogFunctions(setName, setContext)

  return <>
    <Dialog name={name()} context={context()} />
  </>
}

export default Main


