import * as React from 'react'
import { Info } from '../Database'

export function InfoTable(props: { info: Info }) {
    const info = [...props.info].reverse()

    return (
        <table className='table table-sm table-bordered m-0 w-100 h-100' style={{ tableLayout: 'fixed' }}>
            <thead>
                <tr>
                    <th style={{ width: '12%' }}>tid</th>
                    <th style={{ width: '40%' }}>description</th>
                    <th style={{ width: '30%' }}>object</th>
                    <th style={{ width: '18%' }}>data</th>
                </tr>
            </thead>
            <tbody>
                {info.map((entry, i) => (
                    <tr key={i} className={entry.class}>
                        <th className='text-truncate' style={{ width: '12%' }} title={entry.transaction}>
                            {entry.transaction}
                        </th>
                        <td className='text-truncate' style={{ width: '40%' }}>
                            {entry.description}
                        </td>
                        <td
                            className='text-truncate'
                            style={{ width: '30%' }}
                            title={`${!!entry.object ? entry.object.join('/') : ''}`}
                        >
                            {`${!!entry.object ? entry.object.join('/') : ''}`}
                        </td>
                        <td className='text-truncate' style={{ width: '18%' }} title={entry.data}>
                            {entry.data}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
