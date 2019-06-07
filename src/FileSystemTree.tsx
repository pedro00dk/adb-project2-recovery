import * as React from 'react'
import { Item, Menu, MenuProvider, Submenu } from 'react-contexify'

import 'react-contexify/dist/ReactContexify.min.css'

export type File = {
    name: string
    content: string
}

export type Folder = {
    name: string
    //children: (File | Folder)[]
    children: {[name: string]: (File | Folder)}
}

export type Path = (File | Folder)[]

const nodeIsFile = (node: File | Folder): node is File => {
    return !!(node as File).content
}

const getPathString = (path: Path, prefix?: string) => {
    const pathPrefix = prefix != undefined ? `${prefix}:` : ''
    const basePath = path.map(part => part.name).join('/')
    const folderSlash = path.length > 0 && nodeIsFile(path[path.length - 1]) ? '' : '/'
    return `${pathPrefix}${basePath}${folderSlash}`
}

export function FileSystemTree(props: {
    fs: Folder
    fsPrefix?: string
    onClick?: (path: Path) => void
    onLoad?: (path: Path) => void
    onCreate?: (path: Path, type: 'file' | 'folder') => void
    onDelete?: (path: Path) => void
    onRename?: (path: Path, name: string) => void
}) {
    return (
        <div  className='d-flex overflow-auto p-1 w-100 h-100'>
        <ul className='pl-0' style={{ listStyleType: 'none' }}>
            <FileSystemNode
                path={[props.fs]}
                fsPrefix={props.fsPrefix}
                onClick={props.onClick}
                onLoad={props.onLoad}
                onCreate={props.onCreate}
                onDelete={props.onDelete}
                onRename={props.onRename}
                />
        </ul>
                </div>
    )
}

function FileSystemNode(props: {
    path: (File | Folder)[]
    fsPrefix?: string
    onClick?: (path: Path) => void
    onLoad?: (path: Path) => void
    onCreate?: (path: Path, type: 'file' | 'folder') => void
    onDelete?: (path: Path) => void
    onRename?: (path: Path, name: string) => void
}) {
    const [rename, setRename] = React.useState(false)
    const current = props.path[props.path.length - 1]
    const isFile = nodeIsFile(current)
    const pathString = getPathString(props.path, props.fsPrefix)

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
                                key={getPathString(childPath, props.fsPrefix)}
                                path={childPath}
                                fsPrefix={props.fsPrefix}
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
