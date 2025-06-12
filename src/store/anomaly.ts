import {defineStore} from 'pinia';
import {ref, type Ref} from 'vue';
import {KaiStudio} from 'sdk-js';

interface Credentail {
    organizationId: string | undefined;
    instanceId: string | undefined;
    apiKey: string | undefined;
    host: string | undefined;
}

interface DocToMange {
    id: string;
    name: string;
    url: string;
    count_duplicates: number;
    count_conflicts: number;
}

interface docRef {
    id: string;
    name: string;
    url: string;
}

interface Document {
    docId: string;
    information_involved: string;
}

interface Anomaly {
    docsRef: docRef[];
    documents: Document[];
    explanation: string;
    id: string;
    state: string;
    subject: string;
}

interface ManagedIdsStorage {
    [key: string]: string[];
}

export const useAnomalyStore = defineStore('anomalyStore', () => {
    const conflictInformationList: Ref<Anomaly[]> = ref([]);
    const conflictInformationWithSearch: Ref<Anomaly[]> = ref([]);
    const duplicatedInformationList: Ref<Anomaly[]> = ref([]);
    const duplicatedInformationWithSearch: Ref<Anomaly[]> = ref([]);
    const documentsToManageList: Ref<DocToMange[]> = ref([]);
    const missingSubjects: Ref<any[]> = ref([]);
    const topSubjects: Ref<any[]> = ref([]);
    const instaceId: Ref<string> = ref('');

    const managedIds = ref<ManagedIdsStorage>(
        ((): ManagedIdsStorage => {
            const saved = localStorage.getItem('managedIds');
            return saved ? JSON.parse(saved) : {};
        })()
    );

    const credential: Ref<Credentail> = ref({
        organizationId: undefined,
        instanceId: undefined,
        apiKey: undefined,
        host: undefined,
    });

    let sdk: any = ref(null);

    async function init(organizationId?: string, instanceId?: string, apiKey?: string, host?: string) {
        if (organizationId && instanceId && apiKey) {
            sdk.value = new KaiStudio({
                organizationId: organizationId,
                instanceId: instanceId,
                apiKey: apiKey,
            });
            instaceId.value = instanceId;
        } else if (host) {
            sdk.value = new KaiStudio({
                host: host,
                apiKey: apiKey,
            });
            instaceId.value = host
        }

        credential.value = {
            organizationId: organizationId,
            instanceId: instanceId,
            apiKey: apiKey,
            host: host,
        };

        //reset all
        resetConflict();
        resetDuplicated();
        resetConflictSearch();
        resetDuplicatedSearch();
        resetDocumentsToManage();
        resetMissingSubjects();
    }

    function resetConflictSearch() {
        conflictInformationWithSearch.value = [];
    }

    function resetDuplicatedSearch() {
        duplicatedInformationWithSearch.value = [];
    }

    function resetConflict() {
        conflictInformationList.value = [];
    }

    function resetDuplicated() {
        duplicatedInformationList.value = [];
    }

    function resetDocumentsToManage() {
        documentsToManageList.value = [];
    }

    function resetMissingSubjects() {
        missingSubjects.value = [];
    }

    async function getConflictInformation(query: string = '') {
        if (!sdk) {
            return;
        }
        if (query != '') {
            conflictInformationWithSearch.value = [];
        }

        let offset: number = 0;
        const limit: number = 20;
        while (true) {
            let result = await sdk.value.auditInstance().getConflictInformation(limit, offset, query);
            if (result) {
                for (let index = 0; index < result.length; index++) {
                    let document = result[index];
                    if (document && document.docsRef && document.docsRef.length) {
                        query == '' ? conflictInformationList.value.push(document) : conflictInformationWithSearch.value.push(document);
                    }
                }
                offset = offset + limit;
                if (result.length < limit) {
                    break;
                }
            } else {
                break;
            }
        }
    }

    async function getDuplicatedInformation(query: string = '') {
        if (!sdk) {
            return;
        }

        if (query != '') {
            duplicatedInformationWithSearch.value = [];
        }

        let offset: number = 0;
        const limit: number = 20;
        while (true) {
            let result = await sdk.value.auditInstance().getDuplicatedInformation(limit, offset, query);
            if (result) {
                for (let index = 0; index < result.length; index++) {
                    let document = result[index];
                    if (document && document.docsRef && document.docsRef.length) {
                        query == '' ? duplicatedInformationList.value.push(document) : duplicatedInformationWithSearch.value.push(document);
                    }
                }
                offset = offset + limit;
                if (result.length < limit) {
                    break;
                }
            } else {
                break;
            }
        }
    }

    async function getDocumentsToManageList() {
        if (!sdk) {
            return
        }

        documentsToManageList.value = []
        const docList = await sdk.value.auditInstance().getDocumentsToManageList()
        const docs: any[] = []
        if (docList) {
            const docIds: any[] = Object.keys(docList);
            docIds.forEach(id => {
                docs.push({
                    id: id,
                    count_conflicts: docList[id].count_conflicts,
                    count_duplicates: docList[id].count_duplicates
                })
            })
        }
        documentsToManageList.value = docs
    }

    async function getMissingSubjectList() {
        if (!sdk) {
            return;
        }

        let offset: number = 0;
        const limit: number = 20;
        while (true) {
            let result = await sdk.value.auditInstance().getMissingSubjectList(limit, offset);
            if (result) {
                for (let index = 0; index < result.length; index++) {
                    let subject = result[index];
                    if (subject) {
                        missingSubjects.value.push(subject);
                    }
                }
                offset = offset + limit;
                if (result.length < limit) {
                    break;
                }
            } else {
                break;
            }
        }
    }

    function updateManagedIds(id: string, state: string) {
        const isManaged = state.toUpperCase() === 'MANAGED';
        if (!instaceId.value) return;

        // Initialize array for instance if it doesn't exist
        if (!managedIds.value[instaceId.value]) {
            managedIds.value[instaceId.value] = [];
        }

        const ids = managedIds.value[instaceId.value];

        if (isManaged && !ids.includes(id)) {
            ids.push(id);
        } else if (!isManaged) {
            const index = ids.indexOf(id);
            if (index > -1) {
                ids.splice(index, 1);
            }
        }

        // Update the store and localStorage
        managedIds.value[instaceId.value] = ids;
        localStorage.setItem('managedIds', JSON.stringify(managedIds.value));
    }

    function setManagedIdsByLocalStorage() {
        const storedIds = localStorage.getItem('managedIds');
        if (storedIds) {
            managedIds.value = JSON.parse(storedIds);
        }
    }

    async function setConflictState(conflictId: string, state: string) {
        if (!sdk) {
            return;
        }
        await sdk.value.auditInstance().conflictInformationSetState(conflictId, state);
        conflictInformationList.value.forEach((item) => {
            if (item.id == conflictId) {
                item.state = state.toUpperCase();
                updateManagedIds(conflictId, state);
            }
        });
    }

    async function getDocument(fileId: string) {
        if (!sdk) {
            return false;
        }
        return await sdk.value.core().getDocumentById(fileId)
    }

    async function setDuplicateState(duplicateId: string, state: string) {
        if (!sdk) {
            return;
        }
        await sdk.value.auditInstance().duplicatedInformationSetState(duplicateId, state);
        duplicatedInformationList.value.forEach((item) => {
            if (item.id == duplicateId) {
                item.state = state.toUpperCase();
                updateManagedIds(duplicateId, state);
            }
        });
    }

    async function countInformationBySubject(type: string) {
        if (!sdk) {
            return [];
        }
        if (type == "conflict") {
            topSubjects.value = await sdk.value.auditInstance().countConflictInformationBySubject();
        } else {
            topSubjects.value = await sdk.value.auditInstance().countDuplicatedInformationBySubject();
        }

    }

    return {
        conflictInformationList,
        duplicatedInformationList,
        documentsToManageList,
        missingSubjects,
        credential,
        sdk,
        conflictInformationWithSearch,
        duplicatedInformationWithSearch,
        managedIds,
        init,
        resetConflictSearch,
        resetDuplicatedSearch,
        resetConflict,
        resetDuplicated,
        resetDocumentsToManage,
        resetMissingSubjects,
        getConflictInformation,
        getDuplicatedInformation,
        getDocumentsToManageList,
        getMissingSubjectList,
        setConflictState,
        setDuplicateState,
        setManagedIdsByLocalStorage,
        getDocument,
        countInformationBySubject,
        topSubjects
    };
});
