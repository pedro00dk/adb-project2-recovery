import * as React from 'react'
import { Item, Menu, MenuProvider, Submenu } from 'react-contexify'
import { Actions, fromNodePath, getPathname, Node, nodeIsFile, NodePath, StringPath } from '../Database'

import 'react-contexify/dist/ReactContexify.min.css'

export function FileSystemTree(props: {
    fs: NodePath
    fsPrefix: string
    actions: Actions
    click?: (path: StringPath, node: Node) => void
}) {
    return (
        <div className='d-flex overflow-auto p-1 w-100 h-100'>
            <ul className='pl-0' style={{ listStyleType: 'none' }}>
                <FileSystemNode path={props.fs} fsPrefix={props.fsPrefix} actions={props.actions} click={props.click} />
            </ul>
        </div>
    )
}

function FileSystemNode(props: {
    path: NodePath
    fsPrefix: string
    actions: Actions
    click?: (path: StringPath, node: Node) => void
}) {
    const [rename, setRename] = React.useState(false)
    const node = props.path.slice(-1).pop()
    const isFile = nodeIsFile(node)
    const stringPath = fromNodePath(props.path)
    const pathname = getPathname(stringPath, props.fsPrefix)

    return (
        <li>
            <i className={`far ${isFile ? 'fa-file-alt' : 'fa-folder'} mr-1`} />
            {!rename ? (
                <>
                    <MenuProvider className='d-inline-flex' id={pathname}>
                        <span
                            style={{ cursor: 'default', userSelect: 'none' }}
                            onClick={!!props.click ? () => props.click(stringPath, node) : undefined}
                        >
                            {node.name}
                        </span>
                    </MenuProvider>
                    <Menu id={pathname}>
                        {!!props.actions.read && <Item onClick={() => props.actions.read(stringPath)}>read</Item>}
                        {!!props.actions.create && !isFile && (
                            <Submenu label='create'>
                                <Item onClick={() => props.actions.create(stringPath, 'file')}>file</Item>
                                <Item onClick={() => props.actions.create(stringPath, 'folder')}>folder</Item>
                            </Submenu>
                        )}
                        {!!props.actions.delete && <Item onClick={() => props.actions.delete(stringPath)}>delete</Item>}
                        {!!props.actions.rename && <Item onClick={() => setRename(true)}>rename</Item>}
                    </Menu>
                </>
            ) : (
                <input
                    type='text'
                    defaultValue={props.path[props.path.length - 1].name}
                    onBlur={event => (props.actions.rename(stringPath, event.target.value), setRename(false))}
                />
            )}
            {!isFile && (
                <ul className='pl-4' style={{ listStyleType: 'none' }}>
                    {Object.values(node.children)
                        .sort((fa, fb) => (fa.name < fb.name ? -1 : fa.name > fb.name ? 1 : 0))
                        .map((child, i) => {
                            const childPath = [...props.path, child]
                            return (
                                <FileSystemNode
                                    key={i}
                                    path={childPath}
                                    fsPrefix={props.fsPrefix}
                                    actions={props.actions}
                                />
                            )
                        })}
                </ul>
            )}
        </li>
    )
}
