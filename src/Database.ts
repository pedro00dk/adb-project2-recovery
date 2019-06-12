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

export class Database {
    disk: Node = fs
    journal: Journal = []
    cache: Node = { name: 'fs', children: {} }
    activeTransactions: Set<string> = new Set()
    abortedTransactions: Set<string> = new Set()
    consolidatedTransactions: Set<string> = new Set()
    //
    info: Info = []
    transactionIdGenerator: number = 0

    constructor(public setActions: (actions?: Actions, wait?: number) => Promise<void>) {
        this.setDefaultActions()
    }

    private filterActions(...selector: (keyof Actions)[]): Actions {
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

    private setDefaultActions(wait?: number) {
        return this.activeTransactions.size > 0
            ? this.setActions(
                  this.filterActions(
                      'start',
                      'commit',
                      'abort',
                      'read',
                      'write',
                      'create',
                      'delete',
                      'rename',
                      'restart'
                  ),
                  wait
              )
            : this.setActions(this.filterActions('start', 'restart'), wait)
    }

    private async start() {
        // create new transaction id
        const transaction = (this.transactionIdGenerator++).toString()

        this.info.push({ class: 'bg-success', transaction, description: 'start transaction', object: [] })

        // add new transaction to active transactions list and journal
        this.activeTransactions.add(transaction)
        this.journal.push({ transaction, timestamp: new Date(), operation: 'start', object: [] })

        await this.setDefaultActions()
    }

    private async commit(transaction: string) {
        // check if any transaction selected
        if (transaction == undefined) {
            this.info.push({ class: 'bg-warning', transaction, description: 'transaction not selected', object: [] })

            await this.setDefaultActions()
            return
        }

        this.info.push({ class: 'bg-primary', transaction, description: 'end of transaction', object: [] })

        // add commit entry to journal, add in consolidate transactions and remove from active transactions
        this.journal.push({ transaction, timestamp: new Date(), operation: 'commit', object: undefined })
        this.consolidatedTransactions.add(transaction)
        await this.setDefaultActions()
        this.activeTransactions.delete(transaction)
        await this.setDefaultActions()
    }

    private async abort(transaction: string) {
        // check if any transaction selected
        if (transaction == undefined) {
            this.info.push({ class: 'bg-warning', transaction, description: 'transaction not selected', object: [] })

            await this.setDefaultActions()
            return
        }

        this.info.push({ class: 'bg-danger', transaction, description: 'Abort', object: [] })

        this.journal.push({
            transaction,
            timestamp: new Date(),
            operation: 'abort',
            object: []
        })

        await this.restart(transaction)
    }

    private async read(transaction: string, path: StringPath) {
        // check if any transaction selected
        if (transaction == undefined) {
            this.info.push({ class: 'bg-warning', transaction, description: 'transaction not selected', object: [] })

            await this.setDefaultActions()
            return
        }

        this.info.push({ class: '', transaction, description: 'reading path', object: path })

        // copying path from disk to cache
        const diskPath = fromStringPath(path, this.disk)
        let cachePointer = this.cache
        for (let i = 1; i < diskPath.length; i++) {
            const node = diskPath[i]
            if (!cachePointer.children[node.name])
                cachePointer.children[node.name] = nodeIsFile(node) ? { ...node } : { ...node, children: {} }
            cachePointer = cachePointer.children[node.name]
        }

        await this.setDefaultActions()
    }

    private async write(transaction: string, path: StringPath, text: string, updateJournal = true) {
        // check if any transaction selected
        if (transaction == undefined) {
            this.info.push({ class: 'bg-warning', transaction, description: 'transaction not selected', object: path })

            await this.setDefaultActions()
            return
        }

        await this.read(transaction, path)

        // get references to update cache and disk
        const cachePath = fromStringPath(path, this.cache)
        const cacheNode = cachePath.slice(-1).pop()
        const diskPath = fromStringPath(path, this.disk)
        const diskNode = diskPath.slice(-1).pop()

        // check if folder or file content not changed
        if (!nodeIsFile(cacheNode) || cacheNode.content === text) {
            this.info.push({ class: 'bg-warning', transaction, description: 'content not changed', object: path })

            await this.setDefaultActions()
            return
        }

        this.info.push({ class: '', transaction, description: 'writing path', object: path, data: text })

        // add entry to journal
        if (updateJournal)
            this.journal.push({
                transaction,
                timestamp: new Date(),
                operation: 'write',
                object: path,
                before: cacheNode.content
            })

        // update cache and then disk
        cacheNode.content = text
        diskNode.content = text

        await this.setDefaultActions()
    }

    private async create(transaction: string, path: StringPath, type: 'file' | 'folder', updateJournal = true) {
        // check if any transaction selected
        if (transaction == undefined) {
            this.info.push({ class: 'bg-warning', transaction, description: 'transaction not selected', object: path })

            await this.setDefaultActions()
            return
        }

        await this.read(transaction, path)

        // get references to update cache and disk
        const diskPath = fromStringPath(path, this.disk)
        const cachePath = fromStringPath(path, this.cache)
        const diskNode = diskPath.slice(-1).pop()
        const cacheNode = cachePath.slice(-1).pop()

        // check if is a file
        if (nodeIsFile(cacheNode)) {
            this.info.push({ class: 'bg-warning', transaction, description: 'path is file', object: path })

            await this.setDefaultActions()
            return
        }

        // get unique name for folder
        let name: string = type
        for (let i = 1; !!cacheNode.children[name] || !!diskNode.children[name]; i++) name = `${type} ${i}`

        this.info.push({ class: '', transaction, description: `creating path ${type}`, object: path, data: name })

        if (updateJournal)
            this.journal.push({
                transaction,
                timestamp: new Date(),
                operation: type,
                object: [...path, name]
            })

        // update cache and then disk
        cacheNode.children[name] = type === 'file' ? { name, content: '' } : { name, children: {} }
        diskNode.children[name] = type === 'file' ? { name, content: '' } : { name, children: {} }

        await this.setDefaultActions()
        return name
    }

    private async delete(transaction: string, path: StringPath, updateJournal = true) {
        // check if any transaction selected
        if (transaction == undefined) {
            this.info.push({ class: 'bg-warning', transaction, description: 'transaction not selected', object: path })

            await this.setDefaultActions()
            return
        }

        await this.read(transaction, path)

        // get references to update cache and disk
        const cachePath = fromStringPath(path, this.cache)
        const cacheParent = cachePath.slice(-2, -1).pop()

        // check if path is root (has no parent)
        if (!cacheParent) {
            this.info.push({ class: 'bg-warning', transaction, description: 'cant del root', object: path })

            await this.setDefaultActions()
            return
        }

        this.info.push({ class: '', transaction, description: 'deleting path', object: path })

        // recursive function to delete all folder elements
        const postOrderDelete = async (path: StringPath) => {
            const diskPath = fromStringPath(path, this.disk)
            const cachePath = fromStringPath(path, this.cache)
            const diskNode = diskPath.slice(-1).pop()
            const cacheNode = cachePath.slice(-1).pop()
            const diskParent = diskPath.slice(-2, -1).pop()
            const cacheParent = cachePath.slice(-2, -1).pop()

            const isFile = nodeIsFile(diskNode)
            if (!isFile) {
                const children = Object.values(diskNode.children)
                for (const child of children) {
                    await postOrderDelete([...path, child.name])
                }
            } else {
                await this.write(transaction, path, '', updateJournal)
            }

            if (updateJournal)
                this.journal.push({
                    transaction,
                    timestamp: new Date(),
                    operation: 'delete',
                    object: path.slice(0, -1),
                    before: `${isFile ? 'file' : 'folder'}/${path.slice(-1).pop()}`
                })

            const nodeName = path.slice(-1).pop()
            if (!!cacheParent) delete cacheParent.children[nodeName]
            delete diskParent.children[nodeName]
        }
        // run post order delete on current path
        await postOrderDelete(path)

        await this.setDefaultActions()
    }

    private async rename(transaction: string, path: StringPath, name: string, updateJournal = true) {
        // check if any transaction selected
        if (transaction == undefined) {
            this.info.push({ class: 'bg-warning', transaction, description: 'transaction not selected', object: path })

            await this.setDefaultActions()
            return
        }

        await this.read(transaction, path)

        // get references to update cache and disk
        const diskPath = fromStringPath(path, this.disk)
        const cachePath = fromStringPath(path, this.cache)
        const diskNode = diskPath.slice(-1).pop()
        const cacheNode = cachePath.slice(-1).pop()
        const diskParent = diskPath.slice(-2, -1).pop()
        const cacheParent = cachePath.slice(-2, -1).pop()

        // check if path already exists in cache and disk
        if (!cacheNode || !!cacheParent.children[name] || !!diskParent.children[name]) {
            this.info.push({ class: 'bg-warning', transaction, description: 'path already exists', object: path })

            await this.setDefaultActions()
            return
        }

        this.info.push({ class: '', transaction, description: 'renaming path', object: path, data: name })

        const previousName = path.slice(-1).pop()

        if (updateJournal)
            this.journal.push({
                transaction,
                timestamp: new Date(),
                operation: 'rename',
                object: [...path.slice(0, -1), name],
                before: previousName
            })

        // update path name in cache
        cacheNode.name = name
        delete cacheParent.children[previousName]
        cacheParent.children[name] = cacheNode

        // update path name in disk
        diskNode.name = name
        delete diskParent.children[previousName]
        diskParent.children[name] = diskNode

        await this.setDefaultActions()
    }

    private async restart(abortTransaction?: string) {
        // clean cache data

        if (abortTransaction == undefined) this.cache = { name: 'fs', children: {} }

        if (abortTransaction == undefined)
            this.info.push({ class: 'bg-danger', transaction: undefined, description: 'RESTART', object: [] })
        else
            this.info.push({ class: 'bg-danger', transaction: abortTransaction, description: 'Abort UNDO', object: [] })

        const undone = new Set<string>()

        const operationsToUndo =
            abortTransaction == undefined
                ? this.journal
                : this.journal.filter(entry => entry.transaction === abortTransaction)

        const reversedOperationToUndo = [...operationsToUndo].reverse()

        for (const entry of reversedOperationToUndo) {
            if (abortTransaction == undefined) this.journal.pop()

            if (
                this.activeTransactions.has(entry.transaction) &&
                !this.consolidatedTransactions.has(entry.transaction)
            ) {
                switch (entry.operation) {
                    case 'start':
                        this.activeTransactions.delete(entry.transaction)
                        break
                    case 'commit':
                        break
                    case 'write':
                        await this.read('rec', entry.object)
                        await this.write('rec', entry.object, entry.before, false)
                        undone.add(getPathname(entry.object))
                        break
                    case 'file':
                    case 'folder':
                        // creation operations
                        await this.read('rec', entry.object)
                        await this.delete('rec', entry.object, false)
                        undone.delete(getPathname(entry.object))
                        break
                    case 'delete':
                        const [type, name] = entry.before.split('/')
                        await this.read('rec', entry.object)
                        const createdName = await this.create('rec', entry.object, type as 'folder' | 'file', false)
                        await this.rename('rec', [...entry.object, createdName], name, false)
                        undone.add(getPathname([...entry.object, name]))
                        break
                    case 'rename':
                        await this.read('rec', entry.object)
                        await this.rename('rec', entry.object, entry.before, false)
                        undone.delete(getPathname(entry.object))
                        undone.add(getPathname([...entry.object.slice(0, -1), entry.before]))
                        break
                }
            } else if (
                this.activeTransactions.has(entry.transaction) &&
                this.consolidatedTransactions.has(entry.transaction)
            )
                this.activeTransactions.delete(entry.transaction)
        }

        if (abortTransaction == undefined) {
            // clear consolidate transactions
            this.consolidatedTransactions = new Set()

            // clear journal
            this.journal = []
        }

        await this.setDefaultActions()
    }

    // checkpoint() {}
}
