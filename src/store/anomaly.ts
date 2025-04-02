import { defineStore } from 'pinia';
import { ref, type Ref } from 'vue';
import { KaiStudio } from 'sdk-js';

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

export const useAnomalyStore = defineStore('anomalyStore', () => {
    const conflictInformationList: Ref<Anomaly[]> = ref([]);
    const duplicatedInformationList: Ref<Anomaly[]> = ref([]);
    const documentsToManageList: Ref<DocToMange[]> = ref([]);
    const missingSubjects: Ref<any[]> = ref([]);

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
        } else if (host) {
            sdk.value = new KaiStudio({
                host: host,
                apiKey: apiKey,
            });
        }

        credential.value = {
            organizationId: organizationId,
            instanceId: instanceId,
            apiKey: apiKey,
            host: host,
        };
        await getDocumentsToManageList(20, 0);

    }

    async function getConflictInformation(limit: number, initialOffset: number) {
        if (!sdk) {
            return;
        }

        if (initialOffset == 0) {
            conflictInformationList.value = [];
        }

        let offset = initialOffset;
        let result = await sdk.value.auditInstance().getConflictInformation(20, offset);
        if (result) {
            for (let index = 0; index < result.length; index++) {
                let document = result[index];
                if (document && document.docsRef && document.docsRef.length) {
                    conflictInformationList.value.push(document);
                }
            }
        }
        if (result && result.length == limit) {
            offset = offset + limit;
            await getConflictInformation(20, offset);
        }
    }

    async function getDuplicatedInformation(limit: number, initialOffset: number) {
        if (!sdk) {
            return;
        }

        if (initialOffset == 0) {
            duplicatedInformationList.value = [];
        }

        let offset = initialOffset;
        let result = await sdk.value.auditInstance().getDuplicatedInformation(20, offset);
        if (result) {
            for (let index = 0; index < result.length; index++) {
                let document = result[index];
                if (document && document.docsRef && document.docsRef.length) {
                    duplicatedInformationList.value.push(document);
                }
            }
        }
        if (result && result.length == limit) {
            offset = offset + limit;
            await getDuplicatedInformation(limit, offset);
        }
    }

    async function getDocumentsToManageList(limit: number, initialOffset: number) {
        if (!sdk) {
            return;
        }

        if (initialOffset == 0) {
            documentsToManageList.value = [];
        }

        let offset = initialOffset;
        let result = await sdk.value.auditInstance().getDocumentsToManageList(20, offset);
        if (result) {
            for (let index = 0; index < result.length; index++) {
                let document = result[index];
                if (document) {
                    documentsToManageList.value.push(document);
                }
            }
        }
        if (result && result.length == limit) {
            offset = offset + limit;
            await getDocumentsToManageList(limit, offset);
        }
    }

    async function getMissingSubjectList(limit: number, initialOffset: number) {
        if (!sdk) {
            return;
        }

        if (initialOffset == 0) {
            missingSubjects.value = [];
        }

        let offset = initialOffset;
        let result = await sdk.value.auditInstance().getMissingSubjectList(20, offset);
        if (result) {
            for (let index = 0; index < result.length; index++) {
                let subject = result[index];
                if (subject) {
                    missingSubjects.value.push(subject);
                }
            }
        }
        if (result && result.length == limit) {
            offset = offset + limit;
            await getMissingSubjectList(limit, offset);
        }
    }

    async function setConflictState(conflictId: string, state: string) {
        if (!sdk) {
          return
        }
        await sdk.value.auditInstance().conflictInformationSetState(conflictId, state)
        conflictInformationList.value.forEach((item) => {
          if (item.id == conflictId){
            item.state = state.toUpperCase()
          }
        })
      }
      
      async function setDuplicateState(duplicateId: string, state: string) {
        if (!sdk) {
          return
        }
        await sdk.value.auditInstance().duplicatedInformationSetState(duplicateId, state)
        duplicatedInformationList.value.forEach((item) => {
          if (item.id == duplicateId){
            item.state = state.toUpperCase()
          }
        })
      }

    return {
        conflictInformationList,
        duplicatedInformationList,
        documentsToManageList,
        missingSubjects,
        credential,
        sdk,
        init,
        getConflictInformation,
        getDuplicatedInformation,
        getDocumentsToManageList,
        getMissingSubjectList,
        setConflictState,
        setDuplicateState
    };
});
