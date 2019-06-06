import * as React from 'react'
import { Item, Menu, MenuProvider, Submenu } from 'react-contexify'

import 'react-contexify/dist/ReactContexify.min.css'

export type File = {
    name: string
    content: string
}

export type Folder = {
    name: string
    children: (File | Folder)[]
}

export type Path = (File | Folder)[]

const nodeIsFile = (node: File | Folder): node is File => {
    return !!(node as File).content
}

const getPathString = (path: Path) => {
    return `${path.map(part => part.name).join('/')}${path.length > 0 && nodeIsFile(path[path.length - 1]) ? '' : '/'}`
}

export function FileSystemTree(props: {
    fs: Folder
    onClick?: (path: Path) => void
    onLoad?: (path: Path) => void
    onCreate?: (path: Path, type: 'file' | 'folder') => void
    onDelete?: (path: Path) => void
    onRename?: (path: Path, name: string) => void
}) {
    return (
        <ul className='pl-0' style={{ listStyleType: 'none' }}>
            <FileSystemNode
                path={[props.fs]}
                onClick={props.onClick}
                onLoad={props.onLoad}
                onCreate={props.onCreate}
                onDelete={props.onDelete}
                onRename={props.onRename}
            />
        </ul>
    )
}

function FileSystemNode(props: {
    path: (File | Folder)[]
    onClick?: (path: Path) => void
    onLoad?: (path: Path) => void
    onCreate?: (path: Path, type: 'file' | 'folder') => void
    onDelete?: (path: Path) => void
    onRename?: (path: Path, name: string) => void
}) {
    const [rename, setRename] = React.useState(false)
    const current = props.path[props.path.length - 1]
    const isFile = nodeIsFile(current)
    const pathString = getPathString(props.path)

    return (
        <li>
            <i className={`far ${isFile ? 'fa-file-alt' : 'fa-folder'} mr-1`} />
            {!rename ? (
                <>
                    <MenuProvider className='d-inline-flex' id={pathString}>
                        <span
                            style={{ cursor: 'default', userSelect: 'none' }}
                            onDoubleClick={!!props.onClick ? () => props.onClick(props.path) : undefined}
                        >
                            {current.name}
                        </span>
                    </MenuProvider>
                    <Menu id={pathString}>
                        {!!props.onLoad && <Item onClick={() => props.onLoad(props.path)}>load</Item>}
                        {!!props.onCreate && !isFile && (
                            <Submenu label='create'>
                                <Item onClick={() => props.onCreate(props.path, 'file')}>file</Item>
                                <Item onClick={() => props.onCreate(props.path, 'folder')}>folder</Item>
                            </Submenu>
                        )}
                        {!!props.onDelete && <Item onClick={() => props.onDelete(props.path)}>delete</Item>}
                        {!!props.onRename && <Item onClick={() => setRename(true)}>rename</Item>}
                    </Menu>
                </>
            ) : (
                <input
                    type='text'
                    defaultValue={props.path[props.path.length - 1].name}
                    onBlur={event => (props.onRename(props.path, event.target.value), setRename(false))}
                />
            )}
            {!isFile && (
                <ul className='pl-4' style={{ listStyleType: 'none' }}>
                    {(current as Folder).children.map(child => {
                        const childPath = [...props.path, child]
                        return (
                            <FileSystemNode
                                key={getPathString(childPath)}
                                path={childPath}
                                onClick={props.onClick}
                                onLoad={props.onLoad}
                                onCreate={props.onCreate}
                                onDelete={props.onDelete}
                                onRename={props.onRename}
                            />
                        )
                    })}
                </ul>
            )}
        </li>
    )
}
