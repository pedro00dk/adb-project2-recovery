import * as React from 'react'

export function TransactionLists(props: {
    active: string[]
    consolidated: string[]
    aborted: string[]
    selected?: string
    onClick?: (id: string) => void
}) {
    return (
        <div className='d-flex flex-column align-items-center shadow-sm w-100'>
            <h6 className='text-center p-2 mb-1'>Transaction Lists</h6>
            <TransactionList
                name='Active:'
                background='rgba(220, 220, 200, 0.5)'
                list={props.active}
                selected={props.selected}
                onClick={props.onClick}
            />
            <TransactionList name='Consolidated:' background='rgba(0, 110, 255, 0.5)' list={props.consolidated} />
            <TransactionList name='Aborted:' background='rgba(220, 50, 70, 0.5)' list={props.aborted} />
        </div>
    )
}

function TransactionList(props: {
    name: string
    background: string
    list: string[]
    selected?: string
    onClick?: (id: string) => void
}) {

    return (
        <div className='d-flex overflow-auto border py-2 mx-2 w-100'>
            <span className='d-flex p-3 m-2'>{props.name}</span>
            {props.list.map((element, i) => (
                <span
                    key={i}
                    className='shadow-sm p-3 m-2'
                    style={{
                        background: props.background,
                        cursor: 'pointer',
                        ...(props.selected === element ? { border: '3px solid red' } : {})
                    }}
                    onClick={event => (!!props.onClick ? props.onClick(element) : undefined)}
                >
                    {element}
                </span>
            ))}
        </div>
    )
}
