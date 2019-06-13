import * as React from 'react'
import { FileSystemTree } from './components/FileSystemTree'
import { InfoTable } from './components/InfoTable'
import { JournalTable } from './components/JournalTable'
import { SplitPane } from './components/SplitPane'
import { TransactionLists } from './components/TransactionLists'
import { Actions, Journal, Node } from './database/DataTypes'
import { NoUndoRedo } from './database/NoUndoRedo'
import { UndoNoRedo } from './database/UndoNoRedo'

type AlgorithmData = ['immediate', UndoNoRedo] | ['delayed', NoUndoRedo]

export function App() {
    const [actions, setActions] = React.useState<Actions>({})
    const [algorithmData, setAlgorithmData] = React.useState<AlgorithmData>(() => [
        'immediate',
        new UndoNoRedo((actions, wait) => new Promise(res => setTimeout(() => res(setActions(actions)), wait)))
    ])

    const database = algorithmData[1]
    const setAlgorithm = (type: 'immediate' | 'delayed') => {
        const newAlgorithmData = [
            type,
            type === 'immediate'
                ? new UndoNoRedo(
                      (actions, wait) => new Promise(res => setTimeout(() => res(setActions(actions)), wait))
                  )
                : new NoUndoRedo(
                      (actions, wait) => new Promise(res => setTimeout(() => res(setActions(actions)), wait))
                  )
        ] as const
        setAlgorithmData(newAlgorithmData as any)
    }

    const [selectedTransaction, setSelectedTransaction] = React.useState<string>()
    if (selectedTransaction != undefined && !database.activeTransactions.has(selectedTransaction))
        setSelectedTransaction(undefined)

    return (
        <div className='d-flex flex-column vw-100 vh-100'>
            <nav className='navbar navbar-light bg-light shadow-sm'>
                <span className='navbar-brand mb-0'>FS Database</span>
            </nav>
            <div className='d-flex flex-fill w-100'>
                <SplitPane split='vertical' base={'60%'} left={100} right={-100}>
                    <SplitPane split='vertical' base={'50%'} left={100} right={-100}>
                        <div className='d-flex flex-column w-100 h-100'>
                            <h5 className='text-center shadow-sm p-2 mb-2 w-100'>DISK</h5>
                            <SplitPane split='horizontal' base={'50%'} left={100} right={-100}>
                                <div className='d-flex flex-column w-100 h-100'>
                                    <h6 className='text-center p-1 mb-1 w-100'>File System</h6>
                                    <FileSystemTree
                                        fs={database.disk}
                                        prefix='disk'
                                        actions={{
                                            ...actions,
                                            write: undefined,
                                            create: undefined,
                                            delete: undefined,
                                            rename: undefined
                                        }}
                                        transaction={selectedTransaction}
                                    />
                                </div>
                                <div className='d-flex flex-column w-100 h-100'>
                                    <h6 className='text-center p-1 mb-1 w-100'>Journal</h6>
                                    <div className='d-flex overflow-auto w-100'>
                                        <JournalTable journal={database.journal} />
                                    </div>
                                </div>
                            </SplitPane>
                        </div>
                        <div className='d-flex flex-column w-100 h-100'>
                            <h5 className='text-center shadow-sm p-2 mb-2 w-100'>MEMORY</h5>
                            <SplitPane split='horizontal' base={'50%'} left={100} right={-100}>
                                <div className='d-flex flex-column w-100 h-100'>
                                    <h6 className='text-center p-1 mb-1 w-100'>Cache</h6>
                                    <FileSystemTree
                                        fs={database.cache}
                                        prefix='cache'
                                        actions={{ ...actions, read: undefined }}
                                        transaction={selectedTransaction}
                                    />
                                </div>
                                <div className='d-flex flex-column w-100 h-100'>
                                    <h6 className='text-center p-1 mb-1 w-100'>Info</h6>
                                    <div className='d-flex overflow-auto w-100'>
                                        <InfoTable info={database.info} />
                                    </div>
                                </div>
                            </SplitPane>
                        </div>
                    </SplitPane>
                    <div className='d-flex flex-column w-100 h-100'>
                        <RecoveryAlgorithms chosenRA={algorithmData[0]} onChooseRA={setAlgorithm} />
                        <TransactionActions transaction={selectedTransaction} actions={actions} />
                        <TransactionLists
                            active={[...database.activeTransactions].sort().map(transaction => transaction.toString())}
                            consolidated={[...database.consolidatedTransactions]
                                .sort()
                                .map(transaction => transaction.toString())}
                            aborted={[...database.abortedTransactions]
                                .sort()
                                .map(transaction => transaction.toString())}
                            selected={selectedTransaction}
                            onClick={transaction => setSelectedTransaction(transaction)}
                        />
                    </div>
                </SplitPane>
            </div>
        </div>
    )
}

function RecoveryAlgorithms(props: {
    chosenRA: 'immediate' | 'delayed'
    onChooseRA: (algorithm: 'immediate' | 'delayed') => void
}) {
    return (
        <div className='d-flex flex-column shadow-sm m-2 w-100'>
            <h6 className='text-center p-2 mb-1'>Recovery Algorithms</h6>
            <div className='d-flex m-2'>
                <button
                    type='button'
                    className={`w-50 btn ${
                        props.chosenRA === 'immediate' ? 'btn-primary' : 'btn-outline-secondary'
                    } flex-fill m-2`}
                    disabled={props.chosenRA === 'immediate'}
                    onClick={event => props.onChooseRA('immediate')}
                >
                    <span className='d-block'>immediate</span>
                    (UNDO/NO-REDO)
                </button>
                <button
                    type='button'
                    className={`w-50 btn ${
                        props.chosenRA === 'delayed' ? 'btn-primary' : 'btn-outline-secondary'
                    } flex-fill m-2`}
                    disabled={props.chosenRA === 'delayed'}
                    onClick={event => props.onChooseRA('delayed')}
                >
                    <span className='d-block'>delayed</span>
                    (NO-UNDO/REDO)
                </button>
            </div>
        </div>
    )
}

function TransactionActions(props: { transaction: string; actions: Actions }) {
    return (
        <div className='d-flex flex-column shadow-sm m-2 w-100'>
            <h6 className='text-center p-2 mb-1'>Transaction Actions</h6>
            <div className='d-flex mx-2 mb-2'>
                <button
                    type='button'
                    className='btn btn-outline-success m-2 w-25'
                    disabled={!props.actions.start}
                    onClick={props.actions.start}
                >
                    Start Transaction
                </button>
                <button
                    type='button'
                    className='btn btn-outline-primary m-2 w-25'
                    disabled={!props.actions.commit}
                    onClick={event => props.actions.commit(props.transaction)}
                >
                    Commit Transaction
                </button>
                <button
                    type='button'
                    className='btn btn-outline-warning m-2 w-25'
                    disabled={!props.actions.abort}
                    onClick={event => props.actions.abort(props.transaction)}
                >
                    Abort Transaction
                </button>
                <button
                    type='button'
                    className='btn btn-outline-danger  m-2 w-25'
                    disabled={!props.actions.restart}
                    onClick={() => props.actions.restart()}
                >
                    Restart (Fail)
                </button>
            </div>
        </div>
    )
}
