export type Node = {
    name: string
    children?: { [name: string]: Node }
    content?: string
}

export type NodePath = Node[]
export type StringPath = string[]

export const nodeIsFile = (node: Node) => !node.children

export const fromNodePath = (nodePath: NodePath) => nodePath.map(node => node.name)

export const fromStringPath = (stringPath: StringPath, root: Node) => {
    const nodePath = [root]
    for (let i = 1; i < stringPath.length; i++) {
        nodePath.push(nodePath.slice(-1).pop().children[stringPath[i]])
    }
    return nodePath
}

export const getPathname = (path: StringPath, prefix?: string) => {
    return `${prefix != undefined ? `${prefix}:` : ''}${path.join('/')}`
}

export const nodeSorter = (nodeA: Node, nodeB: Node) =>
    !!nodeA.children && !nodeB.children
        ? -1
        : !nodeA.children && !!nodeB.children
        ? 1
        : nodeA.name < nodeB.name
        ? -1
        : nodeA.name > nodeB.name
        ? 1
        : 0

export type LogEntry = {
    transaction: string
    timestamp: Date
    operation: 'start' | 'folder' | 'file' | 'read' | 'write' | 'delete' | 'rename' | 'commit' | 'abort' | 'check'
    object: string[]
    before?: string
    after?: string
    prevTrOp?: number
    nextTrOp?: number
}

export type Journal = LogEntry[]

export type InfoEntry = {
    class: '' | 'bg-light' | 'bg-primary' | 'bg-success' | 'bg-warning' | 'bg-danger'
    transaction: string
    description: string
    object: string[]
    data?: string
}

export type Info = InfoEntry[]

export type Actions = {
    start?: () => void
    commit?: (transaction: string) => void
    abort?: (transaction: string) => void

    read?: (transaction: string, path: StringPath) => void
    create?: (transaction: string, path: StringPath, type: 'file' | 'folder') => void
    delete?: (transaction: string, path: StringPath) => void
    rename?: (transaction: string, path: StringPath, name: string) => void
    write?: (transaction: string, path: StringPath, text: string) => void
    restart?: () => void
}
