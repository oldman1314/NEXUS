import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './styles/fonts.css'
import 'harmonyos-sans/sc-regular'
import 'harmonyos-sans/sc-medium'
import 'harmonyos-sans/sc-bold'
import '@fontsource/noto-sans-sc/400.css'
import '@fontsource/noto-sans-sc/500.css'
import '@fontsource/noto-sans-sc/700.css'
import '@fontsource/lxgw-wenkai/300.css'
import '@fontsource/lxgw-wenkai/700.css'
import './styles/global.css'
import './styles/animations.css'
import './styles/components.css'
import './components/data-table/data-table.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)