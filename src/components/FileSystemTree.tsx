import * as React from 'react'
import { Item, Menu, MenuProvider, Submenu } from 'react-contexify'
import { getPathString, Node, nodeIsFile, Path } from '../Database'

import 'react-contexify/dist/ReactContexify.min.css'

export function FileSystemTree(props: {
    fs: Path
    fsPrefix?: string
    onClick?: (path: Path) => void
    onLoad?: (path: Path) => void
    onCreate?: (path: Path, type: 'file' | 'folder') => void
    onDelete?: (path: Path) => void
    onRename?: (path: Path, name: string) => void
}) {
    return (
        <div className='d-flex overflow-auto p-1 w-100 h-100'>
            <ul className='pl-0' style={{ listStyleType: 'none' }}>
                <FileSystemNode
                    path={props.fs}
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
    path: Path
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
                    {Object.values(current.children)
                        .sort((fa, fb) => (fa.name < fb.name ? -1 : fa.name > fb.name ? 1 : 0))
                        .map(child => {
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
