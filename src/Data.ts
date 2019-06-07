import { Folder, Path } from "./FileSystemTree";
import { Journal } from "./Journal";
import { nfapply } from "q";
import { Children } from "react";
import { number } from "prop-types";
import { fstat } from "fs";

export class Cache{
    private persistentFs: Folder
    private persistentJournal: Journal
    private volatileFs: Folder
    private volatileJournal: Journal
    private activeTransactions: Set<string>
    private abortedTransactions: Set<string>
    private consolidatedTransactions: Set<string>
    private transactionIdGenerator: number

    constructor (){
        this.persistentFs = {name: 'fs', children:{}}
        this.volatileFs = {name: 'fs', children:{}}
        this.persistentJournal = []
        this.volatileJournal = []
        this.activeTransactions = new Set()
        this.abortedTransactions = new Set()
        this.consolidatedTransactions = new Set()
        this.transactionIdGenerator = 0
    }
    
    start() {
        return `${this.transactionIdGenerator++}`
    }

    creteFolder(transaction: string, path: Path) {
        //passo 1:
        this.activeTransactions.add(transaction)
        // efgd
        //passo 2: NA0 FAZ SENTIDO PRA TRANSAÇÃO/OPERÇÃO ADD PASTA

        let volatileParent = this.volatileFs
        path.forEach(folder => volatileParent = volatileParent.children[folder.name] as Folder)


        let name = `folder`
        for(let i = 1; !!volatileParent.children[name]; i ++)
            name = `folder ${i}`
        
        volatileParent.children[name] = {name, children:{}}

        //passo 3:
        this.volatileJournal.push({transaction, timestamp: new Date(), operation: 'create folder', after: name});
        //this.persistentJournal.push({transaction, timestamp: new Date(), operation: 'create folder', after: name});

        //passo 4:
        let persistentParent = this.persistentFs
        path.forEach(folder => persistentParent = persistentParent.children[folder.name] as Folder)
        persistentParent.children[name] = {name, children:{}}
    }

    createFile(transaction: string, path: Path){
        //passo 1:
        this.activeTransactions.add(transaction)
        // efgd
        //passo 2: NA0 FAZ SENTIDO PRA TRANSAÇÃO/OPERÇÃO ADD PASTA

        let volatileParent = this.volatileFs
        path.forEach(folder => volatileParent = volatileParent.children[folder.name] as Folder)

        let name = `file`
        for(let i = 1; !!volatileParent.children[name]; i ++)
            name = `file ${i}`
        
       // volatileParent.children[name] = {name, children:{}}
        this.getParent(this.volatileFs, path).children[name] = {name, content: ''}

        this.volatileJournal.push({transaction, timestamp: new Date(), operation: 'create file', after: name});
        this.persistentJournal.push({transaction, timestamp: new Date(), operation: 'create file', after: name});

        this.getParent(this.persistentFs, path).children[name] = {name, content: ''}
    
    }

    read(){

    }

    write(){

    }

    delete(){

    }

    renameFile(transaction: string, path: Path, filename : string){
//passo 1:
        this.activeTransactions.add(transaction)
        // efgd
        //passo 2: NA0 FAZ SENTIDO PRA TRANSAÇÃO/OPERÇÃO ADD PASTA


        let voilatilePath = this.volatileFs
        path.forEach(folder => voilatilePath = voilatilePath.children[folder.name] as Folder)

        for(let i = 1; !!voilatilePath.children[filename]; i ++)
            filename = filename + i

        
       // volatileParent.children[name] = {name, children:{}}
        this.getParent(this.volatileFs, path).children[name] = {name, content: ''}

        this.volatileJournal.push({transaction, timestamp: new Date(), operation: 'rename file', after: name});
        this.persistentJournal.push({transaction, timestamp: new Date(), operation: 'rename file', after: name});

        this.getParent(this.persistentFs, path).children[name] = {name, content: ''}


    }

    commit(){

    }

    checkpoint(){

    }

    getParent(root: Folder, path: Path){
         
        let parent = root
        path.forEach(folder => parent = parent.children[folder.name] as Folder)
        return parent
    }

}