import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

/*
 * Entry point.
 * Mount the React app to the #root element and import a tiny global stylesheet.
*/
createRoot(document.getElementById('root')).render(<App />)
