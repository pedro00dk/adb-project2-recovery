import * as React from 'react'
import { Item, Menu, MenuProvider, Submenu } from 'react-contexify'
import {
    Actions,
    fromNodePath,
    getPathname,
    Node,
    nodeIsFile,
    NodePath,
    nodeSorter,
    StringPath
} from '../database/DataTypes'

import 'react-contexify/dist/ReactContexify.min.css'

export function FileSystemTree(props: { fs: Node; prefix: string; transaction: string; actions: Actions }) {
    const forceUpdate = React.useState({})[1]
    const updateOnEven = React.useRef(0)
    const stringPath = fromNodePath([props.fs])
    const pathname = getPathname(stringPath, props.prefix)

    return (
        <>
            <MenuProvider className='d-flex overflow-auto p-2 w-100 h-100' id={pathname}>
                <ul className='pl-0' style={{ listStyleType: 'none' }}>
                    {Object.entries(props.fs.children)
                        .sort(([, nodeA], [, nodeB]) => nodeSorter(nodeA, nodeB))
                        .map(([, node], i) => {
                            return (
                                <FileSystemNode
                                    key={i}
                                    path={[props.fs, node]}
                                    prefix={props.prefix}
                                    transaction={props.transaction}
                                    actions={props.actions}
                                />
                            )
                        })}
                </ul>
            </MenuProvider>
            <Menu id={pathname}>
                {!!props.actions.read && (
                    <Item onClick={() => props.actions.read(props.transaction, stringPath)}>read</Item>
                )}
                {!!props.actions.create && (
                    <Submenu label='create'>
                        <Item onClick={() => props.actions.create(props.transaction, stringPath, 'file')}>file</Item>
                        <Item onClick={() => props.actions.create(props.transaction, stringPath, 'folder')}>
                            folder
                        </Item>
                    </Submenu>
                )}
            </Menu>
        </>
    )
}

function FileSystemNode(props: { path: NodePath; prefix: string; transaction: string; actions: Actions }) {
    const [write, setWrite] = React.useState(false)
    const [rename, setRename] = React.useState(false)
    const node = props.path.slice(-1).pop()
    const isFile = nodeIsFile(node)
    const stringPath = fromNodePath(props.path)
    const pathname = getPathname(stringPath, props.prefix)

    return (
        <li className='text-truncate' key={pathname}>
            <i className={`far ${isFile ? 'fa-file-alt' : 'fa-folder'} mr-1`} />
            {!write && !rename ? (
                <>
                    <MenuProvider className={'d-inline-flex'} id={pathname}>
                        <span>{node.name}</span>
                        {isFile && <span className='font-weight-lighter text-muted ml-3'>{node.content}</span>}
                    </MenuProvider>
                    <Menu id={pathname}>
                        {!!props.actions.read && (
                            <Item onClick={() => props.actions.read(props.transaction, stringPath)}>read</Item>
                        )}
                        {!!props.actions.write && isFile && <Item onClick={() => setWrite(true)}>write</Item>}
                        {!!props.actions.create && !isFile && (
                            <Submenu label='create'>
                                <Item onClick={() => props.actions.create(props.transaction, stringPath, 'file')}>
                                    file
                                </Item>
                                <Item onClick={() => props.actions.create(props.transaction, stringPath, 'folder')}>
                                    folder
                                </Item>
                            </Submenu>
                        )}
                        {!!props.actions.delete && (
                            <Item onClick={() => props.actions.delete(props.transaction, stringPath)}>delete</Item>
                        )}
                        {!!props.actions.rename && <Item onClick={() => setRename(true)}>rename</Item>}
                    </Menu>
                </>
            ) : write ? (
                <input
                    type='text'
                    defaultValue={node.content}
                    onBlur={event => (
                        props.actions.write(props.transaction, stringPath, event.target.value), setWrite(false)
                    )}
                />
            ) : rename ? (
                <input
                    type='text'
                    defaultValue={node.name}
                    onBlur={event => (
                        props.actions.rename(props.transaction, stringPath, event.target.value), setRename(false)
                    )}
                />
            ) : (
                undefined
            )}
            {!isFile && (
                <ul className='pl-4' style={{ listStyleType: 'none' }}>
                    {Object.values(node.children)
                        .sort((nodeA, nodeB) => nodeSorter(nodeA, nodeB))
                        .map((child, i) => (
                            <FileSystemNode
                                key={i}
                                path={[...props.path, child]}
                                prefix={props.prefix}
                                transaction={props.transaction}
                                actions={props.actions}
                            />
                        ))}
                </ul>
            )}
        </li>
    )
}
