import { fs } from '../mock'
import { Actions, fromStringPath, getPathname, Info, Journal, Node, nodeIsFile, StringPath } from './DataTypes'

export class NoUndoRedo {
    disk: Node = JSON.parse(JSON.stringify(fs))
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
            restart: () => this.restart(),
            checkpoint: () => this.checkpoint()
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
                      'restart',
                      'checkpoint'
                  ),
                  wait
              )
            : this.setActions(this.filterActions('start', 'restart', 'checkpoint'), wait)
    }

    private async start() {
        // create new transaction id
        const transaction = (this.transactionIdGenerator++).toString()

        this.info.push({ class: 'bg-success', transaction, description: 'start transaction', object: [] })

        // add new transaction to active transactions list and journal
        this.activeTransactions.add(transaction)
        this.journal.push({ transaction, operation: 'start', object: [] })

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
        this.journal.push({ transaction, operation: 'commit', object: [] })
        this.consolidatedTransactions.add(transaction)
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

        this.journal.push({ transaction, operation: 'abort', object: [] })

        this.abortedTransactions.add(transaction)
        this.activeTransactions.delete(transaction)

        // we can not undo partition values read from the transaction
        // they will stay at the cache but will never be moved to the disk
        await this.setDefaultActions()
    }

    private async read(transaction: string, path: StringPath) {
        // check if any transaction selected
        if (transaction == undefined) {
            this.info.push({ class: 'bg-warning', transaction, description: 'transaction not selected', object: [] })

            await this.setDefaultActions()
            return
        }

        this.info.push({ class: '', transaction, description: 'reading path', object: path })

        const lastEntry = this.journal
            .filter(entry => entry.transaction === transaction && getPathname(entry.object) === getPathname(path))
            .pop()

        if (lastEntry != undefined) {
            const cachePath = fromStringPath(path, this.cache)
            const cacheParent = cachePath.slice(-2, -1).pop()
            const cacheNode = cachePath.slice(-1).pop()
            switch (lastEntry.operation) {
                case 'write':
                    cacheNode.content = lastEntry.after
                    break
                case 'file':
                    cacheNode.children[lastEntry.after] = { name: lastEntry.after, content: '' }
                    break
                case 'folder':
                    cacheNode.children[lastEntry.after] = { name: lastEntry.after, children: {} }
                    break
                case 'delete':
                    if (!!cacheParent) delete cacheParent.children[lastEntry.object.slice(-1).pop()]
                    break
                case 'rename':
                    const previousName = cacheNode.name
                    delete cacheParent.children[previousName]
                    cacheNode.name = lastEntry.after
                    cacheParent.children[lastEntry.after] = cacheNode
                    break
            }
        } else {
            // copying path from disk to cache
            const diskPath = fromStringPath(path, this.disk)
            let cachePointer = this.cache
            for (let i = 1; i < diskPath.length; i++) {
                const node = diskPath[i]
                if (!cachePointer.children[node.name])
                    cachePointer.children[node.name] = nodeIsFile(node) ? { ...node } : { ...node, children: {} }
                cachePointer = cachePointer.children[node.name]
            }
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

        // get references to update cache and disk
        const cachePath = fromStringPath(path, this.cache)
        const cacheNode = cachePath.slice(-1).pop()

        // check if folder or file content not changed
        if (!nodeIsFile(cacheNode) || cacheNode.content === text) {
            this.info.push({ class: 'bg-warning', transaction, description: 'content not changed', object: path })

            await this.setDefaultActions()
            return
        }

        this.info.push({ class: '', transaction, description: 'writing path', object: path, data: text })

        // add entry to journal
        if (updateJournal) this.journal.push({ transaction, operation: 'write', object: path, after: text })

        // we have to read the path because we cant do any write operations on an out of date path
        await this.read(transaction, path)
    }

    private async create(transaction: string, path: StringPath, type: 'file' | 'folder', updateJournal = true) {
        // check if any transaction selected
        if (transaction == undefined) {
            this.info.push({ class: 'bg-warning', transaction, description: 'transaction not selected', object: path })

            await this.setDefaultActions()
            return
        }

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
        for (let i = 1; !!cacheNode.children[name] || (!!diskNode && !!diskNode.children[name]); i++)
            name = `${type} ${i}`

        this.info.push({ class: '', transaction, description: `creating path ${type}`, object: path, data: name })

        if (updateJournal) this.journal.push({ transaction, operation: type, object: path, after: name })

        // we have to read the path because we cant do any write operations on an out of date path
        await this.read(transaction, path)
    }

    private async delete(transaction: string, path: StringPath, updateJournal = true) {
        // check if any transaction selected
        if (transaction == undefined) {
            this.info.push({ class: 'bg-warning', transaction, description: 'transaction not selected', object: path })

            await this.setDefaultActions()
            return
        }

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
            const diskNode = diskPath.slice(-1).pop()

            const isFile = nodeIsFile(diskNode)
            if (!isFile) {
                const children = Object.values(diskNode.children)
                for (const child of children) {
                    await postOrderDelete([...path, child.name])
                }
            }

            if (updateJournal) this.journal.push({ transaction, operation: 'delete', object: path })

            // we have to read the path because we cant do any write operations on an out of date path
            await this.read(transaction, path)
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

        // get references to update cache and disk
        const diskPath = fromStringPath(path, this.disk)
        const diskParent = diskPath.slice(-2, -1).pop()
        const diskNode = diskPath.slice(-1).pop()
        const cachePath = fromStringPath(path, this.cache)
        const cacheParent = cachePath.slice(-2, -1).pop()
        const cacheNode = cachePath.slice(-1).pop()

        // check if path already exists in cache and disk
        if (!cacheNode || !!cacheParent.children[name] || !!diskParent.children[name]) {
            this.info.push({ class: 'bg-warning', transaction, description: 'path already exists', object: path })

            await this.setDefaultActions()
            return
        }

        this.info.push({ class: '', transaction, description: 'renaming path', object: path, data: name })

        if (updateJournal) this.journal.push({ transaction, operation: 'rename', object: path, after: name })

        // we have to read the path because we cant do any write operations on an out of date path
        await this.read(transaction, path)
    }

    private async restart(onlyCheckpoint = false) {
        // clean cache data

        if (!onlyCheckpoint) this.cache = { name: 'fs', children: {} }

        if (!onlyCheckpoint)
            this.info.push({ class: 'bg-danger', transaction: undefined, description: 'RESTART', object: [] })

        const redone = new Set<string>()

        const checkpointFinder = [...this.journal].reverse()
        const transactionsToRedo = new Set<string>()
        const transactionsNotToRedo = new Set<string>([...this.abortedTransactions])

        for (const entry of checkpointFinder) {
            if (entry.operation === 'commit') transactionsToRedo.add(entry.transaction)
            else if (entry.operation === 'abort') transactionsNotToRedo.add(entry.transaction)
            else if (!transactionsToRedo.has(entry.transaction)) transactionsNotToRedo.add(entry.transaction)
            else if (entry.operation === 'check') {
                entry.object.forEach(transaction => {
                    if (!transactionsToRedo.has(transaction)) transactionsNotToRedo.add(transaction)
                })
                break
            }
        }

        const transactionsOperationsToRedo = this.journal.filter(entry => transactionsToRedo.has(entry.transaction))
        for (const entry of transactionsOperationsToRedo) {
            const diskPath = fromStringPath(entry.object.length !== 0 ? entry.object : ['fs'], this.disk)
            const diskParent = diskPath.slice(-2, -1).pop()
            const diskNode = diskPath.slice(-1).pop()
            switch (entry.operation) {
                case 'start':
                case 'commit':
                    break
                case 'write':
                    redone.add(getPathname(entry.object))
                    diskNode.content = entry.after
                    break
                case 'file':
                    diskNode.children[entry.after] = { name: entry.after, content: '' }
                    redone.add(getPathname([...entry.object, entry.after]))
                    break
                case 'folder':
                    diskNode.children[entry.after] = { name: entry.after, children: {} }
                    redone.add(getPathname([...entry.object, entry.after]))
                    break
                case 'delete':
                    delete diskParent.children[entry.object.slice(-1).pop()]
                    redone.delete(getPathname(entry.object))
                    break
                case 'rename':
                    const previousName = diskNode.name
                    diskNode.name = entry.after
                    delete diskParent.children[previousName]
                    diskParent.children[entry.after] = diskNode
                    redone.delete(getPathname([...entry.object.slice(0, -1), previousName]))
                    redone.add(getPathname(entry.object))
                    break
            }
        }

        // clear aborted and consolidate transactions
        if (!onlyCheckpoint) {
            this.activeTransactions = new Set()
            this.consolidatedTransactions = new Set()
            this.abortedTransactions = new Set()

            // clear journal
            this.journal = []
        }

        await this.setDefaultActions()
    }

    private async checkpoint() {
        this.info.push({ transaction: undefined, description: 'running checkpoint', object: [], class: 'bg-light' })

        this.journal.push({ transaction: undefined, operation: 'check', object: [...this.activeTransactions] })

        await this.restart(true)
    }
}
