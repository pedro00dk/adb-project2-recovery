import * as React from 'react'

export type Log = {
    transaction: string
    timestamp: Date
    operation: 'srt' | 'fol' | 'fil' | 'rd' | 'wr' | 'del' | 'ren' /* | move */ | 'cmt' | 'abt' | 'chp'
    object?: string[]
    before?: string
    after?: string
    prevTrOp?: number
    nextTrOp?: number
}

export type Journal = Log[]

export function JournalTable(props: { journal?: Journal }) {
    const journal: Journal = [
        {
            transaction: '12',
            timestamp: new Date(),
            operation: 'srt',
            object: undefined,
            before: undefined,
            after: undefined,
            prevTrOp: undefined,
            nextTrOp: 1
        },
        {
            transaction: '12',
            timestamp: new Date(),
            operation: 'fol',
            object: ['home', 'pedro'],
            before: undefined,
            after: 'documents',
            prevTrOp: 0,
            nextTrOp: 2
        },
        {
            transaction: '12',
            timestamp: new Date(),
            operation: 'fil',
            object: ['home', 'pedro', 'documents'],
            before: undefined,
            after: 'new file',
            prevTrOp: 1,
            nextTrOp: 3
        },
        {
            transaction: '12',
            timestamp: new Date(),
            operation: 'cmt',
            object: undefined,
            before: undefined,
            after: undefined,
            prevTrOp: 3,
            nextTrOp: undefined
        },
        {
            transaction: undefined,
            timestamp: new Date(),
            operation: 'chp',
            object: ['12'],
            before: undefined,
            after: undefined,
            prevTrOp: undefined,
            nextTrOp: undefined
        },
        {
            transaction: '12',
            timestamp: new Date(),
            operation: 'srt',
            object: undefined,
            before: undefined,
            after: undefined,
            prevTrOp: undefined,
            nextTrOp: 1
        },
        {
            transaction: '12',
            timestamp: new Date(),
            operation: 'fol',
            object: ['home', 'pedro'],
            before: undefined,
            after: 'documents',
            prevTrOp: 0,
            nextTrOp: 2
        },
        {
            transaction: '12',
            timestamp: new Date(),
            operation: 'fil',
            object: ['home', 'pedro', 'documents'],
            before: undefined,
            after: 'new file',
            prevTrOp: 1,
            nextTrOp: 3
        },
        {
            transaction: '12',
            timestamp: new Date(),
            operation: 'cmt',
            object: undefined,
            before: undefined,
            after: undefined,
            prevTrOp: 3,
            nextTrOp: undefined
        },
        {
            transaction: undefined,
            timestamp: new Date(),
            operation: 'chp',
            object: ['12'],
            before: undefined,
            after: undefined,
            prevTrOp: undefined,
            nextTrOp: undefined
        }
    ]

    journal.reverse()

    const logDecorations: { [operation: string]: string } = {
        srt: 'table-success',
        cmt: 'table-primary',
        abt: 'table-danger',
        chp: 'table-secondary'
    }

    return (
        <table className='table table-sm table-bordered d-flex flex-column w-100 h-100 overflow-auto m-0'>
            <thead>
                <tr className='d-flex flex-row'>
                    <th style={{ width: '12%' }}>tid</th>
                    <th style={{ width: '12%' }}>time</th>
                    <th style={{ width: '10%' }}>op</th>
                    <th style={{ width: '36%' }}>obj</th>
                    <th style={{ width: '15%' }}>{'<<'}</th>
                    <th style={{ width: '15%' }}>{'>>'}</th>
                    {/*
                    <th>{'<-p'}</th>
                    <th>{'p->'}</th> */}
                </tr>
            </thead>
            <tbody className='d-flex flex-column'>
                {journal.map(log => (
                    <tr className={'d-flex ' + logDecorations[log.operation]}>
                        <th className='text-truncate' style={{ width: '12%' }} title={log.transaction}>
                            {log.transaction}
                        </th>
                        <td
                            className='text-truncate'
                            style={{ width: '12%' }}
                            title={`${log.timestamp.getMinutes()}:${log.timestamp.getSeconds()}`}
                        >
                            {log.timestamp.getMinutes()}:{log.timestamp.getSeconds()}
                        </td>
                        <td className='text-truncate' style={{ width: '10%' }} title={log.operation}>
                            {log.operation}
                        </td>
                        <td
                            className='text-truncate'
                            style={{ width: '36%' }}
                            title={`${!!log.object ? log.object.join('/') : ''}`}
                        >{`${!!log.object ? log.object.join('/') : ''}`}</td>
                        <td className='text-truncate' style={{ width: '15%' }} title={log.before}>
                            {log.before}
                        </td>
                        <td className='text-truncate' style={{ width: '15%' }} title={log.after}>
                            {log.after}
                        </td>
                        {/*
                        <td>{log.transaction}</td>
                        <td>{log.transaction}</td> */}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
