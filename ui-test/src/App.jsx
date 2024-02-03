import { createSignal } from 'solid-js'
import renderTemplate from './parser.jsx'

function App() {
  const [counter, setCounter] = createSignal(0)
  const template = renderTemplate()
  const list = ['Food', 'Gold', 'Cloth'];

  return (
    <>
      <h1>Hi</h1>
      {template({ counter, list, increment: () => setCounter(x => x + 1) })}
      {/*<button onClick={() => setCounter(x => x + 1)}>Increment</button>*/}
    </>
  )
}

export default App
