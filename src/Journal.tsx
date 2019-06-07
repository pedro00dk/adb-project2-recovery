import * as React from 'react'

export type Log = {
    transaction: string
    timestamp: Date
    operation:
        | 'start'
        | 'create folder'
        | 'create file'
        | 'read'
        | 'write'
        | 'delete'
        | 'rename'
        /* | move */
        | 'commit'
        | 'checkpoint'
    object?: string[]
    before?: string
    after?: string
    prevTrOp?: number
    nextTrOp?: number
}

export type Journal = Log[]
export function Journal() {
    return (
        <table className='table'>
            <tr>
                <th>Lastname</th>
                <th>Age</th>
            </tr>
            <tr>
                <td>Smith</td>
                <td>50</td>
            </tr>
            <tr>
                <td>Jackson</td>
                <td>94</td>
            </tr>
        </table>
    )
}
