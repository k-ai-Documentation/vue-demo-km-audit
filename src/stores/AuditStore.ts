import {type Ref, ref} from 'vue'
import {defineStore} from 'pinia'
import {KaiStudio} from "sdk-js"


export const useAuditStore = defineStore('auditStore', () => {
    const organizationId = import.meta.env.VITE_APP_ORGANIZATION_ID
    const instanceId = import.meta.env.VITE_APP_INSTANCE_ID
    const apiKey = import.meta.env.VITE_APP_API_KEY
    const host = import.meta.env.VITE_HOST_URL
    let sdk: any = null

    let conflictInformationList: Ref<any[]> = ref([]);
    let duplicatedInformationList: Ref<any[]> = ref([]);
    let documentsToManageList: Ref<any[]> = ref([]);
    let allDocumentList: Ref<any[]> = ref([]);

    if (organizationId && instanceId && apiKey) {
        sdk = new KaiStudio({
            organizationId: organizationId,
            instanceId: instanceId,
            apiKey: apiKey
        })
    }

    if (host) {
        sdk = new KaiStudio({
            host: host,
            apiKey: apiKey
        })
    }

    const kmAudit = sdk?.auditInstance()

    async function getConflictInformation(limit: number, initialOffset: number) {
        if (!sdk) {
            return
        }

        if (initialOffset == 0) {
            conflictInformationList.value = []
        }

        let offset = initialOffset
        let result = await kmAudit.getConflictInformation(20, offset)
        if (result) {
            for (let index = 0; index < result.length; index++) {
                let document = result[index]
                if (document && document.docsRef && document.docsRef.length) {
                    conflictInformationList.value.push(document)
                }
            }
        }
        if (result && result.length == limit) {
            offset = offset + limit
            await getConflictInformation(20, offset)
        }
    }


    async function getDuplicatedInformation(limit: number, initialOffset: number) {
        if (!sdk) {
            return
        }

        if (initialOffset == 0) {
            duplicatedInformationList.value = []
        }

        let offset = initialOffset
        let result = await kmAudit.getDuplicatedInformation(20, offset)
        if (result) {
            for (let index = 0; index < result.length; index++) {
                let document = result[index]
                if (document && document.docsRef && document.docsRef.length) {
                    duplicatedInformationList.value.push(document)
                }
            }
        }
        if (result && result.length == limit) {
            offset = offset + limit
            await getDuplicatedInformation(limit, offset)
        }
    }

    async function getDocumentsToManageList(limit: number, initialOffset: number) {
        if (!sdk) {
            return
        }

        if (initialOffset == 0) {
            documentsToManageList.value = []
        }

        let offset = initialOffset
        let result = await kmAudit.getDocumentsToManageList(20, offset)
        if (result) {
            for (let index = 0; index < result.length; index++) {
                let document = result[index]
                if (document) {
                    documentsToManageList.value.push(document)
                }
            }
        }
        if (result && result.length == limit) {
            offset = offset + limit
            await getDocumentsToManageList(limit, offset)
        }
    }


    async function getAllDocuments() {
        if (!sdk) {
            return
        }

    }

    async function setDuplicateManaged(documentId: number) {
        if (!sdk) {
            return
        }

        await kmAudit.setDuplicatedInformationManaged(documentId)
        await getDuplicatedInformation(20, 0)

    }

    async function setConflictManaged(documentId: number) {
        if (!sdk) {
            return
        }

        await kmAudit.setConflictManaged(documentId)
        await getConflictInformation(20, 0)
    }

    return {
        getConflictInformation,
        getDuplicatedInformation,
        getDocumentsToManageList,
        getAllDocuments,
        conflictInformationList,
        duplicatedInformationList,
        documentsToManageList,
        allDocumentList,
        setDuplicateManaged,
        setConflictManaged
    }
})
