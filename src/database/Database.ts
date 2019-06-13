import { fs } from '../mock'
import { Journal, Node } from './DataTypes'

export class Database {
    disk: Node = JSON.parse(JSON.stringify(fs))
    journal: Journal = []
    cache: Node = { name: 'fs', children: {} }
}
