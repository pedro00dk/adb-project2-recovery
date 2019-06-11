import * as React from 'react'
import { FileSystemTree } from './components/FileSystemTree'
import { JournalTable } from './components/JournalTable'
import { TransactionLists } from './components/TransactionLists'
import { Database, DatabaseActions, Journal, Path } from './Database'

export function App() {
    const [availableActions, setAvailableActions] = React.useState<DatabaseActions>({})
    const [database, setDatabase] = React.useState(
        () =>
            new Database(
                (actions, wait) => new Promise(res => setTimeout(() => res(setAvailableActions(actions)), wait))
            )
    )

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
                        onLoad={availableActions.onLoadPath}
                    />
                </div>
                <div className='d-flex flex-column shadow m-2' style={{ width: '33.33%' }}>
                    <h5 className='text-center shadow-sm p-2 mb-2 w-100'>VOLATILE DATA</h5>
                    <FileSystemJournal
                        fs={[database.volatileFs]}
                        fsPrefix='volatile'
                        journal={database.volatileJournal}
                        onCreate={availableActions.onCreate}
                        onDelete={availableActions.onDelete}
                        onRename={availableActions.onRename}
                    />
                </div>
                <div className='d-flex flex-column align-items-center shadow m-2' style={{ width: '33.33%' }}>
                    <RecoveryAlgorithms chosenRA={'ur'} />
                    <TransactionActions
                        onStartTransaction={availableActions.onStartTransaction}
                        onCommitTransaction={availableActions.onCommitTransaction}
                        onAbortTransaction={availableActions.onAbortTransaction}
                    />
                    <div className='flex-fill' />
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
    fs: Path
    fsPrefix: string
    journal: Journal
    onClick?: (path: Path) => void
    onLoad?: (path: Path) => void
    onCreate?: (path: Path, type: 'file' | 'folder') => void
    onDelete?: (path: Path) => void
    onRename?: (path: Path, name: string) => void
}) {
    return (
        <>
            <div className='d-flex flex-column shadow-sm mb-2 w-100' style={{ height: '30%' }}>
                <h6 className='text-center p-1 mb-1 w-100'>File System</h6>
                <FileSystemTree
                    fs={props.fs}
                    fsPrefix={props.fsPrefix}
                    onClick={props.onClick}
                    onLoad={props.onLoad}
                    onCreate={props.onCreate}
                    onDelete={props.onDelete}
                    onRename={props.onRename}
                />
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

function TransactionActions(props: {
    onStartTransaction?: () => void
    onCommitTransaction?: () => void
    onAbortTransaction?: () => void
    onManualGc?: () => void
}) {
    return (
        <div className='d-flex flex-column shadow-sm m-2 w-100'>
            <h6 className='text-center p-2 mb-1'>Transaction Actions</h6>
            <div className='d-flex mx-2 mb-2'>
                <button
                    type='button'
                    className='btn btn-outline-success flex-fill m-2 w-25'
                    disabled={!props.onStartTransaction}
                    onClick={props.onStartTransaction}
                >
                    Start Transaction
                </button>
                <button
                    type='button'
                    className='btn btn-outline-primary flex-fill m-2 w-25'
                    disabled={!props.onCommitTransaction}
                    onClick={props.onCommitTransaction}
                >
                    Commit Transaction
                </button>
                <button
                    type='button'
                    className='btn btn-outline-danger flex-fill m-2 w-25'
                    disabled={!props.onAbortTransaction}
                    onClick={props.onAbortTransaction}
                >
                    Abort Transaction
                </button>
                <button
                    type='button'
                    className='btn btn-outline-warning flex-fill m-2 w-25'
                    disabled={!props.onManualGc}
                    onClick={props.onManualGc}
                >
                    Manual GC
                </button>
            </div>
        </div>
    )
}
