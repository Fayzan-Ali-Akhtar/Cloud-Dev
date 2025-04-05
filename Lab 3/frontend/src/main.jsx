// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Tailwind CSS styles
import { Amplify } from 'aws-amplify';
// import { AWS_CONFIG } from './constants'; // Or './aws-exports' if you're using Amplify CLI

// Amplify.configure(AWS_CONFIG);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
