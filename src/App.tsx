import * as React from 'react'
import { Editor } from './components/Editor'
import { FileSystemTree } from './components/FileSystemTree'
import { JournalTable } from './components/JournalTable'
import { TransactionLists } from './components/TransactionLists'
import { Actions, Database, Journal, Node, nodeIsFile, NodePath, StringPath } from './Database'

export function App() {
    const [actions, setActions] = React.useState<Actions>({})
    const [database, setDatabase] = React.useState(
        () => new Database((actions, wait) => new Promise(res => setTimeout(() => res(setActions(actions)), wait)))
    )

    const [clickedNode, setClickedNode] = React.useState<{
        path: StringPath
        node: Node
        location: 'persistent' | 'volatile'
    }>({
        path: undefined,
        node: undefined,
        location: undefined
    })

    return (
        <div className='d-flex flex-column vw-100 vh-100'>
            <nav className='navbar navbar-light bg-light'>
                <span className='navbar-brand mb-0 h1'>FSDB</span>
            </nav>
            <div className='d-flex flex-fill'>
                <div className='d-flex flex-column shadow m-2' style={{ width: '33.33%' }}>
                    <h5 className='text-center shadow-sm p-2 mb-2 w-100'>PERSISTENT DATA</h5>
                    <FileSystemJournal
                        fs={[database.persistentFs]}
                        fsPrefix='persistent'
                        journal={database.persistentJournal}
                        actions={{
                            ...actions,
                            write: undefined,
                            create: undefined,
                            delete: undefined,
                            rename: undefined
                        }}
                        click={(path, node) =>
                            nodeIsFile(node)
                                ? setClickedNode({ path, node, location: 'persistent' })
                                : setClickedNode({ path: undefined, node: undefined, location: undefined })
                        }
                    />
                </div>
                <div className='d-flex flex-column shadow m-2' style={{ width: '33.33%' }}>
                    <h5 className='text-center shadow-sm p-2 mb-2 w-100'>VOLATILE DATA</h5>
                    <FileSystemJournal
                        fs={[database.volatileFs]}
                        fsPrefix='volatile'
                        journal={database.volatileJournal}
                        actions={{ ...actions, read: undefined }}
                        click={(path, node) =>
                            nodeIsFile(node)
                                ? setClickedNode({ path, node, location: 'volatile' })
                                : setClickedNode({ path: undefined, node: undefined, location: undefined })
                        }
                    />
                </div>
                <div className='d-flex flex-column align-items-center shadow m-2' style={{ width: '33.33%' }}>
                    <RecoveryAlgorithms chosenRA={'ur'} />
                    <TransactionActions actions={actions} />
                    <div className='d-flex flex-column flex-fill w-100'>
                        <h6 className='text-center p-1 mb-1 w-100'>Editor</h6>
                        <Editor
                            content={!!clickedNode.path ? clickedNode.node.content : ''}
                            editable={!!actions.write && clickedNode.location === 'volatile'}
                            onChange={text => (!!actions.write ? actions.write(clickedNode.path, text) : undefined)}
                        />
                    </div>
                    <TransactionLists
                        active={[...database.activeTransactions].sort().map(transaction => transaction.toString())}
                        consolidated={[...database.consolidatedTransactions]
                            .sort()
                            .map(transaction => transaction.toString())}
                        aborted={[...database.abortedTransactions].sort().map(transaction => transaction.toString())}
                    />
                </div>
            </div>
        </div>
    )
}

function FileSystemJournal(props: {
    fs: NodePath
    fsPrefix: string
    journal: Journal
    actions: Actions
    click?: (path: StringPath, node: Node) => void
}) {
    return (
        <>
            <div className='d-flex flex-column shadow-sm mb-2 w-100' style={{ height: '30%' }}>
                <h6 className='text-center p-1 mb-1 w-100'>File System</h6>
                <FileSystemTree fs={props.fs} fsPrefix={props.fsPrefix} actions={props.actions} click={props.click} />
            </div>
            <div className='d-flex flex-column flex-fill w-100'>
                <h6 className='text-center p-1 mb-1 w-100'>Journal</h6>
                <JournalTable journal={props.journal} />
            </div>
        </>
    )
}

function RecoveryAlgorithms(props: { chosenRA: string; onChooseRA?: (algorithm: string) => void }) {
    React.useEffect(() => {
        if (props.chosenRA != undefined && !!props.onChooseRA) props.onChooseRA('ur')
    }, [])

    return (
        <div className='d-flex flex-column shadow-sm m-2 w-100'>
            <h6 className='text-center p-2 mb-1'>Recovery Algorithms</h6>
            <div className='d-flex m-2'>
                <button
                    type='button'
                    className={`btn ${props.chosenRA === 'ur' ? 'btn-primary' : 'btn-outline-secondary'} flex-fill m-2`}
                    style={{ width: '33%' }}
                    disabled={!props.onChooseRA}
                    onClick={event => props.onChooseRA('ur')}
                >
                    <span className='d-block'>immediate</span>
                    (UNDO/REDO)
                </button>
                <button
                    type='button'
                    className={`btn ${
                        props.chosenRA === 'unr' ? 'btn-primary' : 'btn-outline-secondary'
                    } flex-fill m-2`}
                    style={{ width: '33%' }}
                    disabled={!props.onChooseRA}
                    onClick={event => props.onChooseRA('unr')}
                >
                    <span className='d-block'>immediate</span>
                    (UNDO/NO-REDO)
                </button>
                <button
                    type='button'
                    className={`btn ${
                        props.chosenRA === 'nur' ? 'btn-primary' : 'btn-outline-secondary'
                    } flex-fill m-2`}
                    style={{ width: '33%' }}
                    disabled={!props.onChooseRA}
                    onClick={event => props.onChooseRA('nur')}
                >
                    <span className='d-block'>delayed</span>
                    (NO-UNDO/REDO)
                </button>
            </div>
        </div>
    )
}

function TransactionActions(props: { actions: Actions }) {
    return (
        <div className='d-flex flex-column shadow-sm m-2 w-100'>
            <h6 className='text-center p-2 mb-1'>Transaction Actions</h6>
            <div className='d-flex mx-2 mb-2'>
                <button
                    type='button'
                    className='btn btn-outline-success flex-fill m-2 w-25'
                    disabled={!props.actions.start}
                    onClick={props.actions.start}
                >
                    Start Transaction
                </button>
                <button
                    type='button'
                    className='btn btn-outline-primary flex-fill m-2 w-25'
                    disabled={!props.actions.commit}
                    onClick={props.actions.commit}
                >
                    Commit Transaction
                </button>
                <button
                    type='button'
                    className='btn btn-outline-danger flex-fill m-2 w-25'
                    disabled={!props.actions.abort}
                    onClick={props.actions.abort}
                >
                    Abort Transaction
                </button>
                <button
                    type='button'
                    className='btn btn-outline-warning flex-fill m-2 w-25'
                    disabled={!props.actions.restart}
                    onClick={props.actions.restart}
                >
                    Restart
                </button>
            </div>
        </div>
    )
}
