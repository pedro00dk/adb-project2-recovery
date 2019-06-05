import * as React from 'react'
import { FileSystemTree } from './FileSystemTree'

export function App() {
    return (
        <div className='vw-100 vh-100'>
            hello world!
            <div className='overflow-auto' style={{width: 200, height: 400}}>

            <FileSystemTree
                root={{ name: '', children: [{ name: 'bin', children: [] }, { name: 'home', children: [] }] }}
                />
                </div>
        </div>
    )
}
