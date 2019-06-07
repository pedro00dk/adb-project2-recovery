import * as React from 'react'

export function TransactionLists(props: { active: string[]; aborted: string[]; consolidated: string[] }) {
    return (
        <div className='d-flex flex-column align-items-center shadow-sm mx-2 w-100'>
            <h6 className='text-center p-2 mb-1'>Transaction Lists</h6>
            <div className='d-flex overflow-auto border py-2 mx-2 mb-2 w-100'>
                <span className='d-flex p-3 m-2'>Active:</span>
                {props.active.map((transaction, i) => (
                    <span key={`active ${i}`} className='shadow-sm bg-light p-3 m-2'>
                        {transaction}
                    </span>
                ))}
            </div>
            <div className='d-flex overflow-auto border p-2 mx-2 mb-2 w-100'>
                <span className='d-flex p-3 m-2'>Aborted:</span>
                {props.aborted.map((transaction, i) => (
                    <span
                        key={`active ${i}`}
                        className='shadow-sm p-3 m-2'
                        style={{ background: 'rgba(220, 50, 70, 0.5)' }}
                    >
                        {transaction}
                    </span>
                ))}
            </div>
            <div className='d-flex overflow-auto border py-2 mx-2 w-100'>
                <span className='d-flex p-3 m-2'>Consolidated:</span>
                {props.consolidated.map((transaction, i) => (
                    <span
                        key={`active ${i}`}
                        className='shadow-sm p-3 m-2'
                        style={{ background: 'rgba(0, 110, 255, 0.5)' }}
                    >
                        {transaction}
                    </span>
                ))}
            </div>
        </div>
    )
}
