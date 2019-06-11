import { fs } from './mock'

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
    stringPath.slice(1).forEach(name => nodePath.push(nodePath.slice(-1).pop().children[name]))
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

export type Log = {
    transaction: string
    timestamp: Date
    operation: 'stt' | 'fol' | 'fil' | 'rd' | 'wr' | 'del' | 'ren' | 'cmt' | 'abt' | 'chp'
    object: string[]
    before?: string
    after?: string
    prevTrOp?: number
    nextTrOp?: number
}

export type Journal = Log[]

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

export class Database {
    persistentFs: Node = fs
    persistentJournal: Journal = []
    volatileFs: Node = { name: 'fs', children: {} }
    volatileJournal: Journal = []
    activeTransactions: Set<string> = new Set()
    abortedTransactions: Set<string> = new Set()
    consolidatedTransactions: Set<string> = new Set()
    transactionIdGenerator: number = 0

    constructor(public setActions: (actions?: Actions, wait?: number) => Promise<void>) {
        this.setActions(this.actions('start', 'restart'))
    }

    private actions(...selector: (keyof Actions)[]): Actions {
        const actions: Actions = {
            start: () => this.start(),
            commit: transaction => this.commit(transaction),
            abort: transaction => this.abort(transaction),
            read: (transaction, path) => this.read(transaction, path),
            write: (transaction, path, text) => this.write(transaction, path, text),
            create: (transaction, path, type) => this.create(transaction, path, type),
            delete: (transaction, path) => this.delete(transaction, path),
            rename: (transaction, path, name) => this.rename(transaction, path, name),
            restart: () => this.restart()
        }
        return Object.fromEntries(Object.entries(actions).filter(entry => selector.includes(entry[0] as keyof Actions)))
    }

    private async start() {
        const transaction = (this.transactionIdGenerator++).toString()
        ;[this.volatileJournal, this.persistentJournal].forEach(journal =>
            journal.push({ transaction, timestamp: new Date(), operation: 'stt', object: [] })
        )
        this.activeTransactions.add(transaction)

        await this.setActions(
            this.actions('start', 'commit', 'abort', 'restart', 'read', 'write', 'create', 'delete', 'rename')
        )
    }

    private async commit(transaction: string) {
        if (transaction == undefined) {
            return
        }
        ;[this.volatileJournal, this.persistentJournal].forEach(journal => {
            journal.push({ transaction, timestamp: new Date(), operation: 'cmt', object: undefined })
            journal.push({ transaction: undefined, timestamp: new Date(), operation: 'chp', object: undefined })
        })

        this.consolidatedTransactions.add(transaction)
        this.activeTransactions.delete(transaction)

        await this.setActions(
            this.actions('start', 'commit', 'abort', 'restart', 'read', 'write', 'create', 'delete', 'rename')
        )
    }

    private async abort(transaction: string) {
        if (transaction == undefined) {
            return
        }

        // TODO undo operations

        ;[this.volatileJournal, this.persistentJournal].forEach(journal => {
            journal.push({ transaction, timestamp: new Date(), operation: 'abt', object: undefined })
        })

        this.abortedTransactions.add(transaction)
        this.activeTransactions.delete(transaction)

        await this.setActions(
            this.actions('start', 'commit', 'abort', 'restart', 'read', 'write', 'create', 'delete', 'rename')
        )
    }

    private async read(transaction: string, path: StringPath) {
        if (transaction == undefined) {
            return
        }

        const persistentPath = fromStringPath(path, this.persistentFs)

        let volatilePointer = this.volatileFs
        persistentPath.slice(1).forEach(node => {
            if (!volatilePointer.children[node.name])
                volatilePointer.children[node.name] = nodeIsFile(node) ? { ...node } : { ...node, children: {} }
            volatilePointer = volatilePointer.children[node.name]
        })

        await this.setActions(
            this.actions('start', 'commit', 'abort', 'restart', 'read', 'write', 'create', 'delete', 'rename')
        )
    }

    private async write(transaction: string, path: StringPath, text: string) {
        if (transaction == undefined) {
            return
        }

        const persistentPath = fromStringPath(path, this.persistentFs)
        const volatilePath = fromStringPath(path, this.volatileFs)
        const persistentNode = persistentPath.slice(-1).pop()
        const volatileNode = volatilePath.slice(-1).pop()

        if (volatileNode.content == undefined || volatileNode.content === text) {
            return
        }

        ;[this.volatileJournal, this.persistentJournal].forEach(journal => {
            journal.push({
                transaction,
                timestamp: new Date(),
                operation: 'wr',
                object: path,
                before: volatileNode.content,
                after: text
            })
        })

        volatileNode.content = text
        persistentNode.content = text

        await this.setActions(
            this.actions('start', 'commit', 'abort', 'restart', 'read', 'write', 'create', 'delete', 'rename')
        )
    }

    private async create(transaction: string, path: StringPath, type: 'file' | 'folder') {
        if (transaction == undefined) {
            return
        }

        const persistentPath = fromStringPath(path, this.persistentFs)
        const volatilePath = fromStringPath(path, this.volatileFs)
        const persistentNode = persistentPath.slice(-1).pop()
        const volatileNode = volatilePath.slice(-1).pop()

        let name: string = type
        for (let i = 1; !!persistentNode.children[name] || !!volatileNode.children[name]; i++) {
            name = `${type} ${i}`
        }

        ;[this.volatileJournal, this.persistentJournal].forEach(journal => {
            journal.push({
                transaction,
                timestamp: new Date(),
                operation: type === 'file' ? 'fil' : 'fol',
                object: path,
                after: name
            })
        })

        volatileNode.children[name] = type === 'file' ? { name, content: '' } : { name, children: {} }
        persistentNode.children[name] = type === 'file' ? { name, content: '' } : { name, children: {} }

        await this.setActions(
            this.actions('start', 'commit', 'abort', 'restart', 'read', 'write', 'create', 'delete', 'rename')
        )
    }

    private async delete(transaction: string, path: StringPath) {
        if (transaction == undefined) {
            return
        }

        const persistentPath = fromStringPath(path, this.persistentFs)
        const volatilePath = fromStringPath(path, this.volatileFs)
        const persistentParent = persistentPath.slice(-2, -1).pop()
        const volatileParent = volatilePath.slice(-2, -1).pop()

        if (!volatileParent) {
            // ignore operation, tried to delete root
            return
        }

        ;[this.volatileJournal, this.persistentJournal].forEach(journal =>
            journal.push({ transaction, timestamp: new Date(), operation: 'del', object: path })
        )

        const nodeName = path.slice(-1).pop()
        delete volatileParent.children[nodeName]
        delete persistentParent.children[nodeName]

        await this.setActions(
            this.actions('start', 'commit', 'abort', 'restart', 'read', 'write', 'create', 'delete', 'rename')
        )
    }

    private async rename(transaction: string, path: StringPath, name: string) {
        if (transaction == undefined) {
            return
        }

        const persistentPath = fromStringPath(path, this.persistentFs)
        const volatilePath = fromStringPath(path, this.volatileFs)
        const persistentNode = persistentPath.slice(-1).pop()
        const volatileNode = volatilePath.slice(-1).pop()
        const persistentParent = persistentPath.slice(-2, -1).pop()
        const volatileParent = volatilePath.slice(-2, -1).pop()

        if (!volatileParent || !!volatileParent.children[name] || !!persistentParent.children[name]) {
            // ignore operation, name already exists or tried to rename root
            return
        }

        ;[this.volatileJournal, this.persistentJournal].forEach(journal => {
            journal.push({ transaction, timestamp: new Date(), operation: 'ren', object: path, after: name })
        })

        const nodeName = path.slice(-1).pop()

        volatileNode.name = name
        delete volatileParent.children[nodeName]
        volatileParent.children[name] = volatileNode

        delete persistentParent.children[nodeName]
        persistentNode.name = name
        persistentParent.children[name] = persistentNode

        await this.setActions(
            this.actions('start', 'commit', 'abort', 'restart', 'read', 'write', 'create', 'delete', 'rename')
        )
    }

    private async restart() {
        this.volatileFs = { name: 'fs', children: {} }
        this.volatileJournal = []

        await this.setActions(this.actions('start', 'restart'))
    }

    // checkpoint() {}
}
