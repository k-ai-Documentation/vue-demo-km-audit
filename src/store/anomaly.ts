import {defineStore} from 'pinia';
import {ref, type Ref} from 'vue';
import {KaiStudio} from 'sdk-js';
import indexedDBManager from "./../lib/IndexedDBManager";

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
        const duplicatedInformationList: Ref<Anomaly[]> = ref([]);
        const anomaliesBySubject: Ref<Anomaly[]> = ref([]);
        const anomaliesBySubjectLoaded: Ref<boolean> = ref(false);

        const conflictDocIdsList: Ref<any[]> = ref([]);
        const duplicatedDocIdsList: Ref<any[]> = ref([]);
        const documentsToManageList: Ref<DocToMange[]> = ref([]);
        const missingSubjects: Ref<any[]> = ref([]);
        const loadingConflictDocumentPairs: Ref<boolean> = ref(true);
        const loadingDuplicateDocumentPairs: Ref<boolean> = ref(true);
        const topSubjects: Ref<{ conflict: any[], duplicated: any[] }> = ref({conflict: [], duplicated: []});
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
            resetDocumentsToManage();
            resetMissingSubjects();
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

        async function getConflictInformation(limit: number = 20, offset: number = 0, query: string = '', state: string = "") {
            if (!sdk) {
                return;
            }

            if (offset == 0) {
                conflictInformationList.value = []
            }

            let result = await sdk.value.auditInstance().getConflictInformation(limit, offset, query, state);
            if (result) {
                for (let index = 0; index < result.length; index++) {
                    let document = result[index];
                    if (document && document.docsRef && document.docsRef.length) {
                        conflictInformationList.value.push(document)
                    }
                }
            }
        }

        async function getDuplicatedInformation(limit: number = 20, offset: number = 0, query: string = '', state: string = "") {
            if (!sdk) {
                return;
            }

            if (offset == 0) {
                duplicatedInformationList.value = []
            }

            let result = await sdk.value.auditInstance().getDuplicatedInformation(limit, offset, query, state);
            if (result) {
                for (let index = 0; index < result.length; index++) {
                    let document = result[index];
                    if (document && document.docsRef && document.docsRef.length) {
                        duplicatedInformationList.value.push(document)
                    }
                }
            }
        }

        async function getDocumentsToManageList() {
            if (!sdk) {
                return
            }

            documentsToManageList.value = []
            const docList = await sdk.value.auditInstance().getDocumentIdsToManageList()
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

        async function getAnomaliesBySubject(type: string, subject: string, limit: number = 10, offset: number = 0) {
            if (!sdk) {
                return;
            }

            let result = []

            if (offset == 0) {
                anomaliesBySubjectLoaded.value = true
                anomaliesBySubject.value = []
            }

            if (anomaliesBySubjectLoaded.value) {
                anomaliesBySubjectLoaded.value = false

                if (type == "conflict") {
                    result = await sdk.value.auditInstance().getConflictInformationBySubject(subject, limit, offset);
                } else {
                    result = await sdk.value.auditInstance().getDuplicateInformationBySubject(subject, limit, offset);
                }

                result.forEach((el: any) => {
                    anomaliesBySubject.value.push(el)
                })

                if (result.length < limit) {
                    anomaliesBySubjectLoaded.value = false
                } else {
                    anomaliesBySubjectLoaded.value = true
                }
            }

        }

        async function getDocument(fileId: string) {
            if (!sdk) {
                return false;
            }
            const files: any = await indexedDBManager.getAll('files')
            if (fileId && files[fileId]) {
                return files[fileId]
            } else {
                const file = await sdk.value.core().getDocumentById(fileId)
                indexedDBManager.updateData('files', [
                    {
                        ...file,
                        id: fileId
                    }
                ])
                return file
            }
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
                topSubjects.value.conflict = await sdk.value.auditInstance().countConflictInformationBySubject();
            } else {
                topSubjects.value.duplicated = await sdk.value.auditInstance().countDuplicatedInformationBySubject();
            }

        }

        async function getAnomaliesDocumentPair(type: string, limit: number = 10, offset: number = 0, documentName: string = "") {
            if (!sdk) {
                return [];
            }
            let result = []
            if (offset == 0) {
                if (type == "conflict") {
                    conflictDocIdsList.value = []
                    loadingConflictDocumentPairs.value = true
                } else {
                    duplicatedDocIdsList.value = []
                    loadingDuplicateDocumentPairs.value = true
                }
            }

            if (loadingConflictDocumentPairs.value && type == "conflict") {
                loadingConflictDocumentPairs.value = false
                result = await sdk.value.auditInstance().getConflictInformationDocumentPair(limit, offset, documentName)
                result.forEach((docPair: any) => {
                    const sortedDocPair = [...docPair].sort();
                    const exists = conflictDocIdsList.value.some((existingPair: any) => {
                        const sortedExisting = [...existingPair].sort();
                        return JSON.stringify(sortedExisting) === JSON.stringify(sortedDocPair);
                    });

                    if (!exists) {
                        conflictDocIdsList.value.push(docPair);
                    }
                });

                loadingConflictDocumentPairs.value = result.length >= limit;
            }

            if (loadingDuplicateDocumentPairs.value && type == "duplicated") {
                loadingDuplicateDocumentPairs.value = false
                result = await sdk.value.auditInstance().getDuplicateInformationDocumentPair(limit, offset, documentName)
                result.forEach((docPair: any) => {
                    const sortedDocPair = [...docPair].sort();
                    const exists = duplicatedDocIdsList.value.some((existingPair: any) => {
                        const sortedExisting = [...existingPair].sort();
                        return JSON.stringify(sortedExisting) === JSON.stringify(sortedDocPair);
                    });

                    if (!exists) {
                        duplicatedDocIdsList.value.push(docPair);
                    }
                });

                loadingDuplicateDocumentPairs.value = result.length >= limit;

            }
        }


        async function getAnomaliesByDocumentIds(docIds: string[], type: string) {
            if (!sdk) {
                return [];
            }
            let result = []
            if (type == "conflict") {
                result = await sdk.value.auditInstance().getConflictInformationByDocuments(docIds)
            } else {
                result = await sdk.value.auditInstance().getDuplicateInformationByDocuments(docIds)
            }
            return result
        }

        return {
            conflictInformationList,
            duplicatedInformationList,
            documentsToManageList,
            missingSubjects,
            credential,
            sdk,
            managedIds,
            topSubjects,
            conflictDocIdsList,
            duplicatedDocIdsList,
            anomaliesBySubject,
            init,
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
            getAnomaliesDocumentPair,
            getAnomaliesByDocumentIds,
            getAnomaliesBySubject
        };
    })
;
