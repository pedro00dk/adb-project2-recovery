// required for parcel to generate target > ES5 builds
import '@babel/polyfill'

import * as React from 'react'
import * as ReactDom from 'react-dom'
import { App } from './App'

ReactDom.render(<App />, document.getElementById('root'))
