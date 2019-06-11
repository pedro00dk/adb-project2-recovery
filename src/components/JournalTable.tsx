import * as React from 'react'
import { Journal } from '../Database'

export function JournalTable(props: { journal: Journal }) {
    const journal = [...props.journal].reverse()

    const logDecorations: { [operation: string]: string } = {
        stt: 'table-success',
        cmt: 'table-primary',
        abt: 'table-warning',
        chp: 'table-secondary'
    }

    return (
        <table className='table table-sm table-bordered m-0 w-100 h-100' style={{ tableLayout: 'fixed' }}>
            <thead>
                <tr>
                    <th style={{ width: '12%' }}>tid</th>
                    <th style={{ width: '12%' }}>time</th>
                    <th style={{ width: '15%' }}>op</th>
                    <th style={{ width: '31%' }}>object</th>
                    <th style={{ width: '15%' }}>{'<<'}</th>
                    <th style={{ width: '15%' }}>{'>>'}</th>
                </tr>
            </thead>
            <tbody>
                {journal.map((log, i) => (
                    <tr key={i} className={logDecorations[log.operation]}>
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
                        <td className='text-truncate' style={{ width: '15%' }} title={log.operation}>
                            {log.operation}
                        </td>
                        <td
                            className='text-truncate'
                            style={{ width: '31%' }}
                            title={`${!!log.object ? log.object.join('/') : ''}`}
                        >{`${!!log.object ? log.object.join('/') : ''}`}</td>
                        <td className='text-truncate' style={{ width: '15%' }} title={log.before}>
                            {log.before}
                        </td>
                        <td className='text-truncate' style={{ width: '15%' }} title={log.after}>
                            {log.after}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
