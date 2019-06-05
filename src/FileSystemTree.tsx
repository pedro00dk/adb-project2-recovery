import * as React from 'react'
import { Item, Menu, MenuProvider } from 'react-contexify'

import 'react-contexify/dist/ReactContexify.min.css'

export type File = {
    name: string
    content: string
}

export type Folder = {
    name: string
    children: (File | Folder)[]
}

const isFile = (fileOrFolder: File | Folder): fileOrFolder is File => {
    return !!(fileOrFolder as File).content
}

const getFullPath = (path: (File | Folder)[]) => {
    return `${path.map(part => part.name).join('/')}${path.length > 0 && isFile(path[path.length - 1]) ? '' : '/'}`
}

export function FileSystemTree(props: { root: Folder }) {
    const mock: Folder = {
        name: 'home',
        children: [
            {
                name: 'pedro',
                children: [
                    { name: 'documents', children: [{ name: 'file', content: 'content of a file' }] },
                    { name: 'pictures', children: [{ name: 'file', content: 'content of a file' }] }
                ]
            }
        ]
    }

    return (
        <ul className='pl-0' style={{ listStyleType: 'none' }}>
            <FolderNode parents={[]} folder={mock} />
        </ul>
    )
}

function FolderNode(props: { parents: Folder[]; folder: Folder }) {
    const [rename, setRename] = React.useState(false)
    const asParent = [...props.parents, props.folder]
    const fullPath = getFullPath([...props.parents, props.folder])

    return (
        <li>
            <i className='far fa-folder mr-1' />
            {!rename ? (
                <MenuProvider className='d-inline-flex' id={fullPath}>
                    <span style={{ cursor: 'default', userSelect: 'none' }} onDoubleClick={event => setRename(true)}>
                        {props.folder.name}
                    </span>
                </MenuProvider>
            ) : (
                <input
                    type='text'
                    defaultValue={props.folder.name}
                    onBlur={event => (console.log('rename event'), setRename(false))}
                />
            )}
            <ul className='pl-4' style={{ listStyleType: 'none' }}>
                {props.folder.children.map(child =>
                    isFile(child) ? (
                        <FileNode key={getFullPath([...asParent, child])} parents={asParent} file={child} />
                    ) : (
                        <FolderNode key={getFullPath([...asParent, child])} parents={asParent} folder={child} />
                    )
                )}
            </ul>
            <Menu id={fullPath}>
                <Item onClick={() => console.log('create event')}>create</Item>
                <Item onClick={() => setRename(true)}>rename</Item>
                <Item onClick={() => console.log('delete event')}>delete</Item>
            </Menu>
        </li>
    )
}

function FileNode(props: { parents: Folder[]; file: File }) {
    const [rename, setRename] = React.useState(false)
    const fullPath = getFullPath([...props.parents, props.file])
    return (
        <li>
            <i className='far fa-file-alt mr-1' />
            {!rename ? (
                <MenuProvider className='d-inline-flex' id={fullPath}>
                    <span style={{ cursor: 'default', userSelect: 'none' }}>{props.file.name}</span>
                </MenuProvider>
            ) : (
                <input
                    type='text'
                    defaultValue={props.file.name}
                    onBlur={event => (console.log('rename event'), setRename(false))}
                />
            )}
            <Menu id={fullPath}>
                <Item onClick={() => setRename(true)}>rename</Item>
                <Item onClick={() => console.log('delete event')}>delete</Item>
            </Menu>
        </li>
    )
}
