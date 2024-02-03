import { createSignal } from 'solid-js'
import renderTemplate from './parser.jsx'

function App() {
  const [counter, setCounter] = createSignal(0)

  return (
    <>
      <h1>Hi</h1>
      {renderTemplate({ counter, increment: () => setCounter(x => x + 1) })}
      <button onClick={() => setCounter(x => x + 1)}>Increment</button>
    </>
  )
}

export default App
