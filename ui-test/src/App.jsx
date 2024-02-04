import { createSignal } from 'solid-js'
import renderTemplate from './parser/index.js'

function App() {
  const [counter, setCounter] = createSignal(0)
  const template = renderTemplate()
  const list = () => ['Food', 'Gold', 'Cloth'].slice(0, counter())

  const context = {
    counter,
    list,
    increment: () => setCounter(x => x + 1),
    reset: () => setCounter(0),
  }

  return (
    <>
      <h1>Hi</h1>
      {template(context)}
    </>
  )
}

export default App
