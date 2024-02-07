import { createSignal } from 'solid-js'
import { createStore } from 'solid-js/store'

import Dialog from './Dialog'

import styles from './Main.module.scss'

let dialogOpenFn, dialogCloseFn
export const dialogFns = {
  get open() {
    return dialogOpenFn ?? ((...args) => {
      console.error('Cannot open dialog, ui boundary not initialized:', ...args)
    })
  },

  get close() {
    return dialogCloseFn ?? ((...args) => {
      console.error('Cannot open dialog, ui boundary not initialized:', ...args)
    })
  }
}

function registerDialogFunctions (setName, setContext) {
  dialogOpenFn = (name, context = {}) => {
    setContext(context)
    setName(name)

    return setContext
  }
  dialogCloseFn = () => setName('')
}

function Main() {
  const [name, setName] = createSignal('')
  const [context, setContext] = createStore({})
  registerDialogFunctions(setName, setContext)

  return <>
    <Dialog name={name()} context={context} />
  </>
}

export default Main


