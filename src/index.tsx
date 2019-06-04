// required for parcel to generate target > ES5 builds
import '@babel/polyfill'

import * as React from 'react'
import * as ReactDom from 'react-dom'

ReactDom.render(<div>hello world!</div>, document.getElementById('root'))
