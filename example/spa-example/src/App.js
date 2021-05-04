import React  from 'react';
import { BrowserRouter as Router, Route } from "react-router-dom";

import RedirectLogin from './RedirectLogin.js'
import ReturnLogin from './ReturnLogin.js'

function App() {
  return (
      <div className="App">
        <Router>
          <Route path='/' exact component={RedirectLogin} />
          <Route path='/return' component={ReturnLogin} />
        </Router>
      </div>
  );
}

export default App;
