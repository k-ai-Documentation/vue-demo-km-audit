const indexedDB =
    window.indexedDB ||
    (window as any).webkitIndexedDB ||
    (window as any).msIndexedDB ||
    (window as any).mozIndexedDB;

const currentVersion = 3;

type StoreModel = {
    name: string;
    key: string;
};

const storeModels: StoreModel[] = [
    {name: "files", key: "id"}
];

type DBFunction = (args: any) => Promise<any>;

type StackItem = {
    fn: DBFunction;
    args: any;
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
};

class IndexedDBManager {
    private currentDB: IDBDatabase | null | false = null;
    private stack: StackItem[] = [];

    constructor() {
        this.runStack();
    }

    setDB(db: IDBDatabase | false) {
        this.currentDB = db;
    }

    private runStack() {
        const interval = setInterval(async () => {
            if (this.currentDB) {
                for (let i = this.stack.length - 1; i >= 0; i--) {
                    const item = this.stack[i];
                    try {
                        const result = await item.fn.call(this, item.args);
                        item.resolve(result);
                    } catch (e) {
                        item.reject(e);
                    }
                    this.stack.splice(i, 1);
                }

                if (this.stack.length === 0) {
                    clearInterval(interval);
                }
            }
        }, 200);
    }

    private async addStack(
        fn: DBFunction,
        args: any,
        resolve: (value: any) => void,
        reject: (reason?: any) => void
    ) {
        if (this.currentDB) {
            try {
                resolve(await fn.call(this, args));
            } catch (e) {
                reject(e);
            }
        } else {
            this.stack.push({fn, args, resolve, reject});
        }
    }

    getAll<T = any>(store: string): Promise<T[]> {
        return new Promise((resolve, reject) => {
            if (this.currentDB === false) {
                return reject(false);
            }
            this.addStack(this._getAll, {store}, resolve, reject);
        });
    }

    private _getAll<T = any>({store}: { store: string }): Promise<T[]> {
        return new Promise((resolve, reject) => {
            try {
                if (!this.currentDB) {
                    return reject(new Error("Database is not available."));
                }

                const transaction = this.currentDB!.transaction(store, "readonly");
                const objectStore = transaction.objectStore(store);
                const request = objectStore.getAll();

                request.onerror = (event: any) => reject(event);
                request.onsuccess = (event: any) =>
                    resolve((event.target as IDBRequest).result);
            } catch (e) {
                reject(e);
            }
        });
    }

    updateData(store: string, datas: any[]): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.currentDB === false) {
                return reject(false);
            }
            this.addStack(this._updateData, {store, datas}, resolve, reject);
        });
    }

    private _updateData({store, datas}: { store: string; datas: any[] }): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                if (!this.currentDB) {
                    return reject(new Error("Database is not available."));
                }

                const objectStore = this.currentDB!.transaction(store, "readwrite").objectStore(store);
                for (const data of datas) {
                    objectStore.put(data);
                }
                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    }

    deleteByKey(store: string, id: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            if (this.currentDB === false) {
                return reject(false);
            }
            this.addStack(this._deleteByKey, {store, id}, resolve, reject);
        });
    }

    private _deleteByKey({store, id}: { store: string; id: string }): Promise<boolean> {
        return new Promise((resolve, reject) => {
            try {
                if (!this.currentDB) {
                    return reject(new Error("Database is not available."));
                }

                const objectStore = this.currentDB!.transaction(store, "readwrite").objectStore(store);
                objectStore.delete(id);
                resolve(true);
            } catch (e) {
                reject(e);
            }
        });
    }

    clearStoreDatas(store: string): Promise<Event> {
        return new Promise((resolve, reject) => {
            if (this.currentDB === false) {
                return reject(false);
            }
            this.addStack(this._clearStoreDatas, {store}, resolve, reject);
        });
    }

    private _clearStoreDatas({store}: { store: string }): Promise<Event> {
        return new Promise((resolve, reject) => {
            try {
                if (!this.currentDB) {
                    return reject(new Error("Database is not available."));
                }

                const objectStore = this.currentDB!.transaction(store, "readwrite").objectStore(store);
                const request = objectStore.clear();

                request.onsuccess = (event: any) => resolve(event);
                request.onerror = (event: any) => reject(event);
            } catch (e) {
                reject(e);
            }
        });
    }

    async clearAllDatas(): Promise<void> {
        this.stack = [];
        for (const store of storeModels) {
            try {
                await this.clearStoreDatas(store.name);
            } catch (e) {
                console.error(e);
            }
        }
    }
}

const indexedDBManager = new IndexedDBManager();

const request = indexedDB.open("kai-studio-audit", currentVersion);

request.onerror = function () {
    indexedDBManager.setDB(false);
};

request.onsuccess = function (event) {
    indexedDBManager.setDB((event.target as IDBOpenDBRequest).result);
};

request.onupgradeneeded = function (event) {
    const db = (event.target as IDBOpenDBRequest).result;

    for (const newStore of storeModels) {
        if (!db.objectStoreNames.contains(newStore.name)) {
            db.createObjectStore(newStore.name, {
                keyPath: newStore.key
            });
        }
    }
};

export default indexedDBManager;
