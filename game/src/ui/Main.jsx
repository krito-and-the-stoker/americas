import Dialog from './Dialog'
import Overlay from './overlay/Overlay'

import styles from './Main.module.scss'

import SignalTest from './overlay/SignalTest'

function Main() {
  return <>
    <Overlay />
    <Dialog />
    <SignalTest />
  </>
}

export default Main


