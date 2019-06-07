import * as React from 'react'
import { FileSystemTree, Folder } from './FileSystemTree'
import { JournalTable } from './JournalTable'

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
                        { name: 'file1', content: 'content of a file' }
                        //         { name: 'file3', content: 'content of a file' },
                        //         { name: 'file4', children: [] },
                        //         { name: 'file5', content: 'content of a file' },
                        //         { name: 'file', content: 'content of a file' },
                        //         { name: 'file3', content: 'content of a file' },
                        //         { name: 'file4', children: [] },
                        //         { name: 'file5', content: 'content of a file' },
                        //         { name: 'file', content: 'content of a file' },
                        //         { name: 'file3', content: 'content of a file' },
                        //         { name: 'file4', children: [] },
                        //         { name: 'file5', content: 'content of a file' },
                        //         { name: 'file', content: 'content of a file' },
                        //         { name: 'file3', content: 'content of a file' },
                        //         { name: 'file4', children: [] },
                        //         { name: 'file5', content: 'content of a file' },
                        //         { name: 'file', content: 'content of a file' },
                        //         { name: 'file6', content: 'content of a file' }
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
            <div className='d-flex flex-fill'>
                <div className='d-flex flex-column shadow m-2' style={{ width: '33.33%' }}>
                    <h5 className='text-center shadow-sm p-2 mb-2 w-100'>PERSISTENT DATA</h5>
                    <FileSystemJournal fsPrefix='disk' />
                </div>
                <div className='d-flex flex-column shadow m-2' style={{ width: '33.33%' }}>
                    <h5 className='text-center shadow-sm p-2 mb-2 w-100'>VOLATILE DATA</h5>
                    <FileSystemJournal fsPrefix='mem' />
                </div>
                <div className='d-flex flex-column align-items-center shadow m-2' style={{ width: '33.33%' }}>
                    <RecoveryAlgorithms />
                    <TransactionActions onStartTransaction={() => undefined} />
                    <div className='flex-fill'></div>
                    <TransactionLists active={['12', '13', '25']} aborted={['16']} consolidated={['8']} />
                </div>
            </div>
        </div>
    )
}

function FileSystemJournal(props: { fsPrefix?: string }) {
    return (
        <>
            <div className='d-flex flex-column shadow-sm mb-2 w-100' style={{ height: '30%' }}>
                <h6 className='text-center p-1 mb-1 w-100'>File System</h6>
                <FileSystemTree fs={mock} fsPrefix={props.fsPrefix} />
            </div>
            <div className='d-flex flex-column flex-fill w-100'>
                <h6 className='text-center p-1 mb-1 w-100'>Journal</h6>
                <JournalTable />
            </div>
        </>
    )
}

function RecoveryAlgorithms(props: { chosenRA?: string; onChooseRA?: (algorithm: string) => void }) {
    React.useEffect(() => {
        if (props.chosenRA != undefined) props.onChooseRA('ru')
    }, [])

    return (
        <div className='d-flex m-2 w-100'>
            <button
                type='button'
                className={`btn ${
                    !props.chosenRA || props.chosenRA === 'ru' ? 'btn-primary' : 'btn-outline-secondary'
                } flex-fill m-2`}
                style={{ width: '33%' }}
                onClick={event => (!!props.onChooseRA ? props.onChooseRA('ru') : undefined)}
            >
                <span className='d-block'>immediate</span>
                (REDO/UNDO)
            </button>
            <button
                type='button'
                className={`btn ${props.chosenRA === 'nru' ? 'btn-primary' : 'btn-outline-secondary'} flex-fill m-2`}
                style={{ width: '33%' }}
                onClick={event => (!!props.onChooseRA ? props.onChooseRA('nru') : undefined)}
            >
                <span className='d-block'>immediate</span>
                (NO-REDO/UNDO)
            </button>
            <button
                type='button'
                className={`btn ${props.chosenRA === 'rnu' ? 'btn-primary' : 'btn-outline-secondary'} flex-fill m-2`}
                style={{ width: '33%' }}
                onClick={event => (!!props.onChooseRA ? props.onChooseRA('rnu') : undefined)}
            >
                <span className='d-block'>delayed</span>
                (REDO/NO-UNDO)
            </button>
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
        <div className='d-flex mx-2 mb-2 w-100'>
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
    )
}

function TransactionLists(props: { active: string[]; aborted: string[]; consolidated: string[] }) {
    return (
        <div className='d-flex flex-column align-items-center mx-2 mb-2 w-100'>
            <h5>Transaction Lists</h5>
            <div className='d-flex py-2 mx-2 mb-2 w-100 overflow-auto border'>
                <span className='d-flex p-3 m-2'>Active:</span>
                {props.active.map((transaction, i) => (
                    <span key={`active ${i}`} className='shadow-sm p-3 m-2 bg-light'>
                        {transaction}
                    </span>
                ))}
            </div>
            <div className='d-flex p-2 mx-2 mb-2 overflow-auto w-100 border'>
                <span className='d-flex p-3 m-2'>Aborted:</span>
                {props.aborted.map((transaction, i) => (
                    <span key={`active ${i}`} className='shadow-sm p-3 m-2 bg-danger'>
                        {transaction}
                    </span>
                ))}
            </div>
            <div className='d-flex py-2 mx-2 mb-2 overflow-auto w-100 bg-light'>
                <span className='d-flex p-3 m-2'>Consolidated:</span>
                {props.consolidated.map((transaction, i) => (
                    <span key={`active ${i}`} className='shadow-sm p-3 m-2 bg-primary'>
                        {transaction}
                    </span>
                ))}
            </div>
        </div>
    )
}
