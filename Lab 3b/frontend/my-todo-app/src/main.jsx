import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import {Amplify} from 'aws-amplify'
import awsConfig from './aws-exports'

// Configure Amplify with your AWS Cognito settings
Amplify.configure(awsConfig)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
