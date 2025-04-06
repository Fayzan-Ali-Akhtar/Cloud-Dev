import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Signup from './Signup';
import Confirm from './Confirm';
import Login from './Login';
import Feed from './Feed';
import { PrivateRoute, PublicRoute } from './ProtectedRoutes';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicRoute />}>
          <Route path="/signup" element={<Signup />} />
          <Route path="/confirm" element={<Confirm />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Signup />} />
        </Route>
        
        {/* Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/feed" element={<Feed />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default App;
