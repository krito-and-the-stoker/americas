import { Router, Route } from "@solidjs/router";

import Dashboard from './components/Dashboard'
import ErrorList from './components/ErrorList'


function App() {
  return (
    <Router>
      <Route path='/' component={Dashboard} />
      <Route path='/errors' component={ErrorList} />
    </Router>
  )
}

export default App
