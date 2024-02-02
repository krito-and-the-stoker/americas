import { createSignal, createResource, createEffect } from 'solid-js'
import Dashboard from './components/Dashboard'

function App() {
  const [count, setCount] = createSignal(0)
  
  return (
    <>
      <Dashboard />
    </>
  )
}

export default App
