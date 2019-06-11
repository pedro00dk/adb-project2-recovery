export type Node = {
    name: string
    children?: { [name: string]: Node }
    content?: string
}

export type Path = Node[]

export const nodeIsFile = (node: Node) => !node.children

export const getPathString = (path: Path, prefix?: string) => {
    const pathPrefix = prefix != undefined ? `${prefix}:` : ''
    const basePath = path.map(part => part.name).join('/')
    const folderSlash = path.length > 0 && nodeIsFile(path[path.length - 1]) ? '' : '/'
    return `${pathPrefix}${basePath}${folderSlash}`
}

export type Log = {
    transaction: string
    timestamp: Date
    operation: 'stt' | 'fol' | 'fil' | 'rd' | 'wr' | 'del' | 'ren' /* | move */ | 'cmt' | 'abt' | 'chp'
    object: string[]
    before?: string
    after?: string
    prevTrOp?: number
    nextTrOp?: number
}

export type Journal = Log[]

export type DatabaseActions = {
    onStartTransaction?: () => void
    onCommitTransaction?: () => void
    onAbortTransaction?: () => void
    onManualGc?: () => void
    onLoadPath?: (path: Path) => void
    onCreate?: (path: Path, type: 'file' | 'folder') => void
    onDelete?: (path: Path) => void
    onRename?: (path: Path, name: string) => void
    onWrite?: (path: Path, text: string) => void
}

const persistentFs: Node = {
    name: 'fs',
    children: {
        elisa: {
            name: 'elisa',
            children: {
                file0: { name: 'file0', content: 'contents of file0' },
                file1: { name: 'file1', content: 'contents of file1' },
                file2: { name: 'file2', content: 'contents of file2' },
                file3: { name: 'file3', content: 'contents of file3' },
                file4: { name: 'file4', content: 'contents of file4' }
            }
        },
        jailton: {
            name: 'jailton',
            children: {
                file0: { name: 'file0', content: 'contents of file0' },
                file1: { name: 'file1', content: 'contents of file1' },
                file2: { name: 'file2', content: 'contents of file2' },
                file3: { name: 'file3', content: 'contents of file3' },
                file4: { name: 'file4', content: 'contents of file4' }
            }
        },
        karine: {
            name: 'karine',
            children: {
                file0: { name: 'file0', content: 'contents of file0' },
                file1: { name: 'file1', content: 'contents of file1' },
                file2: { name: 'file2', content: 'contents of file2' },
                file3: { name: 'file3', content: 'contents of file3' },
                file4: { name: 'file4', content: 'contents of file4' }
            }
        },
        pedro: {
            name: 'pedro',
            children: {
                file0: { name: 'file0', content: 'contents of file0' },
                file1: { name: 'file1', content: 'contents of file1' },
                file2: { name: 'file2', content: 'contents of file2' },
                file3: { name: 'file3', content: 'contents of file3' },
                file4: { name: 'file4', content: 'contents of file4' }
            }
        },
        thay: {
            name: 'thay',
            children: {
                file0: { name: 'file0', content: 'contents of file0' },
                file1: { name: 'file1', content: 'contents of file1' },
                file2: { name: 'file2', content: 'contents of file2' },
                file3: { name: 'file3', content: 'contents of file3' },
                file4: { name: 'file4', content: 'contents of file4' }
            }
        }
    }
}

export class Database {
    persistentFs: Node = persistentFs
    persistentJournal: Journal = []
    volatileFs: Node = { name: 'fs', children: {} }
    volatileJournal: Journal = []
    activeTransactions: Set<number> = new Set()
    abortedTransactions: Set<number> = new Set()
    consolidatedTransactions: Set<number> = new Set()
    transactionIdGenerator: number = 0
    //
    currentTransactionId: number = undefined

    constructor(public actionSetter: (actions?: DatabaseActions, wait?: number) => Promise<void>) {
        this.actionSetter({
            onStartTransaction: () => this.start()
        })
    }

    private async start() {
        this.currentTransactionId = this.transactionIdGenerator++
        this.volatileJournal.push({
            transaction: this.currentTransactionId.toString(),
            timestamp: new Date(),
            operation: 'stt',
            object: undefined
        })
        this.persistentJournal.push({
            transaction: this.currentTransactionId.toString(),
            timestamp: new Date(),
            operation: 'stt',
            object: undefined
        })
        this.activeTransactions.add(this.currentTransactionId)
        await this.actionSetter(
            {
                onCommitTransaction: () => this.commit(),
                onAbortTransaction: () => this.abort(),
                onLoadPath: path => this.read(path),
                onCreate: (path, type) => this.create(path, type),
                onDelete: path => this.delete(path),
                onRename: (path, name) => this.rename(path, name),
                onWrite: (path, text) => this.write(path, text)
            },
            500
        )
    }

    private async commit() {
        this.volatileJournal.push({
            transaction: this.currentTransactionId.toString(),
            timestamp: new Date(),
            operation: 'cmt',
            object: undefined
        })
        this.volatileJournal.push({
            transaction: undefined,
            timestamp: new Date(),
            operation: 'chp',
            object: undefined
        })
        this.persistentJournal.push({
            transaction: this.currentTransactionId.toString(),
            timestamp: new Date(),
            operation: 'cmt',
            object: undefined
        })
        this.persistentJournal.push({
            transaction: undefined,
            timestamp: new Date(),
            operation: 'chp',
            object: undefined
        })
        this.consolidatedTransactions.add(this.currentTransactionId)
        this.activeTransactions.delete(this.currentTransactionId)
        this.currentTransactionId = undefined
        await this.actionSetter(
            {
                onStartTransaction: () => this.start()
            },
            500
        )
    }

    private async abort() {
        // TODO undo operations
        this.abortedTransactions.add(this.currentTransactionId)
        this.activeTransactions.delete(this.currentTransactionId)
        this.currentTransactionId = undefined
        await this.actionSetter(
            {
                onStartTransaction: () => this.start()
            },
            500
        )
    }

    private async read(persistentPath: Path) {
        let volatilePointer = this.volatileFs
        persistentPath.slice(1).forEach(node => {
            if (!volatilePointer.children[node.name])
                volatilePointer.children[node.name] = nodeIsFile(node) ? { ...node } : { ...node, children: {} }
            volatilePointer = volatilePointer.children[node.name]
        })
        await this.actionSetter(
            {
                onCommitTransaction: () => this.commit(),
                onAbortTransaction: () => this.abort(),
                onLoadPath: path => this.read(path),
                onCreate: (path, type) => this.create(path, type),
                onDelete: path => this.delete(path),
                onRename: (path, name) => this.rename(path, name),
                onWrite: (path, text) => this.write(path, text)
            },
            100
        )
    }

    async create(volatilePath: Path, type: 'file' | 'folder') {
        const volatileParent = volatilePath[volatilePath.length - 1]

        let name: string = type
        for (let i = 1; !!volatileParent.children[name]; i++) name = `${type} ${i}`

        this.volatileJournal.push({
            transaction: this.currentTransactionId.toString(),
            timestamp: new Date(),
            operation: type === 'file' ? 'fil' : 'fol',
            object: volatilePath.map(node => node.name),
            after: name
        })
        this.persistentJournal.push({
            transaction: this.currentTransactionId.toString(),
            timestamp: new Date(),
            operation: type === 'file' ? 'fil' : 'fol',
            object: volatilePath.map(node => node.name),
            after: name
        })

        volatileParent.children[name] = type === 'file' ? { name, content: '' } : { name, children: {} }
        const persistentPath = this.getMirrorPath(this.persistentFs, volatilePath)
        const persistentParent = persistentPath[persistentPath.length - 1]
        persistentParent.children[name] = type === 'file' ? { name, content: '' } : { name, children: {} }

        await this.actionSetter(
            {
                onCommitTransaction: () => this.commit(),
                onAbortTransaction: () => this.abort(),
                onLoadPath: path => this.read(path),
                onCreate: (path, type) => this.create(path, type),
                onDelete: path => this.delete(path),
                onRename: (path, name) => this.rename(path, name),
                onWrite: (path, text) => this.write(path, text)
            },
            100
        )
    }

    async delete(volatilePath: Path) {
        const volatileParent = volatilePath[volatilePath.length - 2]
        if (!volatileParent) {
            // abort transaction, tried to delete root
        }

        this.volatileJournal.push({
            transaction: this.currentTransactionId.toString(),
            timestamp: new Date(),
            operation: 'del',
            object: volatilePath.map(node => node.name)
        })
        this.persistentJournal.push({
            transaction: this.currentTransactionId.toString(),
            timestamp: new Date(),
            operation: 'del',
            object: volatilePath.map(node => node.name)
        })
        const elementName = volatilePath[volatilePath.length - 1].name
        delete volatileParent.children[elementName]
        const persistentPath = this.getMirrorPath(this.persistentFs, volatilePath)
        const persistentParent = persistentPath[persistentPath.length - 2]
        delete persistentParent.children[elementName]

        await this.actionSetter(
            {
                onCommitTransaction: () => this.commit(),
                onAbortTransaction: () => this.abort(),
                onLoadPath: path => this.read(path),
                onCreate: (path, type) => this.create(path, type),
                onDelete: path => this.delete(path),
                onRename: (path, name) => this.rename(path, name),
                onWrite: (path, text) => this.write(path, text)
            },
            100
        )
    }

    async rename(volatilePath: Path, name: string) {
        const volatileParent = volatilePath[volatilePath.length - 2]

        if (!!volatileParent.children[name]) {
            // abort transaction, name already exists
        }

        this.volatileJournal.push({
            transaction: this.currentTransactionId.toString(),
            timestamp: new Date(),
            operation: 'ren',
            object: volatilePath.map(node => node.name),
            after: name
        })
        this.persistentJournal.push({
            transaction: this.currentTransactionId.toString(),
            timestamp: new Date(),
            operation: 'ren',
            object: volatilePath.map(node => node.name),
            after: name
        })

        const volatileNode = volatilePath[volatilePath.length - 1]
        const previousName = volatileNode.name

        volatileNode.name = name
        delete volatileParent.children[previousName]
        volatileParent.children[name] = volatileNode

        const persistentPath = this.getMirrorPath(this.persistentFs, volatilePath)
        const persistentParent = persistentPath[persistentPath.length - 2]
        const persistentNode = persistentParent.children[previousName]
        persistentNode.name = name
        delete persistentParent.children[previousName]
        persistentParent.children[name] = persistentNode

        await this.actionSetter(
            {
                onCommitTransaction: () => this.commit(),
                onAbortTransaction: () => this.abort(),
                onLoadPath: path => this.read(path),
                onCreate: (path, type) => this.create(path, type),
                onDelete: path => this.delete(path),
                onRename: (path, name) => this.rename(path, name),
                onWrite: (path, text) => this.write(path, text)
            },
            100
        )
    }

    async write(volatilePath: Path, text: string) {
        const volatileNode = volatilePath[volatilePath.length - 1]
        if (volatileNode.content === text) return

        this.volatileJournal.push({
            transaction: this.currentTransactionId.toString(),
            timestamp: new Date(),
            operation: 'wr',
            object: volatilePath.map(node => node.name),
            before: volatileNode.content,
            after: text
        })
        this.persistentJournal.push({
            transaction: this.currentTransactionId.toString(),
            timestamp: new Date(),
            operation: 'wr',
            object: volatilePath.map(node => node.name),
            before: volatileNode.content,
            after: text
        })

        volatileNode.content = text
        const persistentPath = this.getMirrorPath(this.persistentFs, volatilePath)
        const persistentNode = persistentPath[persistentPath.length - 1]
        persistentNode.content = text

        await this.actionSetter(
            {
                onCommitTransaction: () => this.commit(),
                onAbortTransaction: () => this.abort(),
                onLoadPath: path => this.read(path),
                onCreate: (path, type) => this.create(path, type),
                onDelete: path => this.delete(path),
                onRename: (path, name) => this.rename(path, name),
                onWrite: (path, text) => this.write(path, text)
            },
            100
        )
    }

    restart() {}

    // checkpoint() {}

    getMirrorPath(root: Node, path: Path) {
        const mirrorPath = [root]
        path.slice(1).forEach(node => {
            const lastNode = mirrorPath[mirrorPath.length - 1]
            mirrorPath.push(lastNode.children[node.name])
        })
        return mirrorPath
    }
}
