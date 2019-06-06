import * as React from 'react'
import { FileSystemTree, Folder } from './FileSystemTree'

export function App() {
    const mock: Folder = {
        name: 'home',
        children: [
            {
                name: 'pedro',
                children: [
                    { name: 'documents', children: [{ name: 'file', content: 'content of a file' }] },
                    {
                        name: 'pictures',
                        children: [
                            { name: 'file1', content: 'content of a file' },
                            { name: 'file2', content: 'content of a file' },
                            { name: 'file3', content: 'content of a file' },
                            { name: 'file4', children: [] },
                            { name: 'file5', content: 'content of a file' },
                            { name: 'file', content: 'content of a file' },
                            { name: 'file6', content: 'content of a file' }
                        ]
                    }
                ]
            }
        ]
    }

    return (
        <div className='vw-100 vh-100'>
            hello world!
            <div className='overflow-auto' style={{ width: 200, height: 400 }}>
                <FileSystemTree
                    fs={mock}
                    onClick={path => console.log('double click', path)}
                    onRename={(path, name) => console.log('rename', path, name)}
                    onCreate={(path, type) => console.log('create', path, type)}
                />
            </div>
        </div>
    )
}
