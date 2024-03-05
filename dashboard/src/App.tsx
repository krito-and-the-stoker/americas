import { Router, Route } from "@solidjs/router";

import Dashboard from './components/Dashboard'
import ErrorList from './components/ErrorList'
import InspectError from './components/InspectError'


function App() {
  return (
    <Router>
      <Route path='/' component={Dashboard} />
      <Route path='/errors' component={ErrorList} />
      <Route path='/errors/:id' component={InspectError} />
    </Router>
  )
}

export default App
