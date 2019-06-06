import * as React from 'react'
import { FileSystemTree, Folder } from './FileSystemTree'
import { Journal } from './Journal';

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
                        { name: 'file3', content: 'content of a file' },
                        { name: 'file4', children: [] },
                        { name: 'file5', content: 'content of a file' },
                        { name: 'file', content: 'content of a file' },
                        { name: 'file3', content: 'content of a file' },
                        { name: 'file4', children: [] },
                        { name: 'file5', content: 'content of a file' },
                        { name: 'file', content: 'content of a file' },
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

export function App() {
    return (
        <div className='d-flex flex-column vw-100 vh-100'>
            <nav className='navbar navbar-light bg-light'>
                <span className='navbar-brand mb-0 h1'>FSDB</span>
            </nav>
            <div className='d-flex flex-row flex-fill'>
                <div className='d-flex flex-column align-items-center shadow w-25 m-2'>
                    <h5 className='text-center shadow-sm p-2 mb-2 w-100'>PERSISTENT DATA</h5>
                    <div className='d-flex flex-column shadow-sm w-100 h-50'>
                        <h6 className='text-center p-1 mb-1 w-100'>File System</h6>
                        <FileSystemTree
                            fs={mock}
                            onClick={path => console.log('double click', path)}
                            onRename={(path, name) => console.log('rename', path, name)}
                            onCreate={(path, type) => console.log('create', path, type)}
                        />
                    </div>
                    <div className='d-flex flex-column flex-fill'>
                        <h6 className='text-center p-1 mb-1 w-100'>Journal</h6>
                        <Journal />
                    </div>
                </div>
                <div className='d-flex flex-column align-items-center shadow w-25 m-2'>
                    <h5 className='text-center shadow-sm p-2 mb-2 w-100'>VOLATILE DATA</h5>
                    <div className='d-flex flex-column shadow-sm w-100 h-50'>
                        <h6 className='text-center p-1 mb-1 w-100'>File System</h6>
                        <FileSystemTree
                            fs={mock}
                            fsPrefix='mem'
                            onClick={path => console.log('double click', path)}
                            onRename={(path, name) => console.log('rename', path, name)}
                            onCreate={(path, type) => console.log('create', path, type)}
                        />
                    </div>
                    <div className='d-flex flex-column flex-fill'>
                        <h6 className='text-center p-1 mb-1 w-100'>Journal</h6>
                        {/* <Journal /> */}
                    </div>
                </div>
                <div className='d-flex flex-column flex-fill align-items-center shadow m-2'>
                    <button type='button' className='btn btn-secondary'>
                        Secondary
                    </button>
                    <button type='button' className='btn btn-secondary'>
                        Secondary
                    </button>
                    <button type='button' className='btn btn-secondary'>
                        Secondary
                    </button>
                </div>
            </div>
        </div>
    )
}
