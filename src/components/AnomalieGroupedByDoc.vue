<template lang="pug">
.anomalie-grouped-by-doc
    .filter-group
        input.simple-input-h30(placeholder="Filter by document name" v-model="filterByDocument" @focus="showSearchList = true")
        .search-item-list(v-if="filterByDocument && showSearchList")
            p.text-regular-14.text-white(v-for="document in filteredDocumentsName" :key="document" @click="selectDocument(document)") {{document}}
    .doc-box(v-for="(documentList, index) in Object.values(groupedDocuments)" :key="documentList")
        p.text-bold-16.text-white.open-doc(@click="downloadAllDocs(documentList[0])") Two related documents \#{{index + 1}}
        p.text-regular-14.text-white.open-doc(@click="goTo(documentList[0].docsRef[0])") {{documentList[0].docsRef[0].name}}
        p.text-regular-14.text-white.open-doc(@click="goTo(documentList[0].docsRef[1])") {{documentList[0].docsRef[1].name}}
        .anomalies-table
            table
                thead
                    tr
                        th.text-bold-14.text-white Subject
                        th.text-bold-14.text-white Status
                        th
                            p.text-bold-14.text-white Information Involved for 
                            p.text-bold-14.text-white {{documentList[0].docsRef[0].name}} 
                        th
                            p.text-bold-14.text-white Information Involved for 
                            p.text-bold-14.text-white {{documentList[0].docsRef[1].name}}
                        th.text-bold-14.text-white Explanation
                tbody
                    tr(v-for="anomaly in documentList" :key="anomaly.id")
                        td.text-regular-14.text-white.subject {{anomaly.subject}}
                        td.state
                            p.text-white.text-medium-14(v-if="anomaly.state == 'DISAPPEARED'") {{anomalieStateList[anomaly.id]}}
                            DropdownSelect(v-else)
                                template(#trigger)
                                    .trigger
                                        p.text-white.text-medium-14 {{anomaly.state}}
                                template(#body)
                                    .select-box(v-for="state in getAvailableStateList(anomaly)" :key="state")
                                        p.text-white.text-medium-14( @click="setStatus(anomaly.id, state)"  v-if="state != anomalieStateList[anomaly.id]") {{state}}
                        td.text-regular-14.text-white.info {{anomaly.documents[0].information_involved}}
                        td.text-regular-14.text-white.info {{anomaly.documents[1].information_involved}}
                        td.text-regular-14.text-white {{anomaly.explanation}}

</template>

<script setup lang="ts">
import { ref, computed,onMounted, type ComputedRef, type Ref, watch } from 'vue';
import DropdownSelect from './DropdownSelect.vue';
import Buffer from 'vue-buffer';
import { useAnomalyStore } from './../store/anomaly';
import {storeToRefs} from 'pinia';

const anomalyStore = useAnomalyStore();
const { conflictInformationList, duplicatedInformationList,sdk } = storeToRefs(anomalyStore);

const filterByDocument: Ref<string> = ref('');
const showSearchList: Ref<boolean> = ref(false);

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

const props = defineProps<{
    type: string;
}>();

const anomalies = props.type == 'conflict' ? conflictInformationList.value : duplicatedInformationList.value;

const stateList: Ref<string[]> = ref(["DETECTED", "MANAGED", "IGNORED", "DISAPPEARED", "REDETECTED"])

const getAvailableStateList = (anomaly: Anomaly): string[] => {
    if (!anomaly) return [];

    if(anomaly.state === 'MANAGED' ) {
        return ["DETECTED", "IGNORED"]
    }
    if(anomaly.state === 'DETECTED' ) {
        return ["MANAGED", "IGNORED"]
    }
    if(anomaly.state === 'IGNORED' ) {
        return ["DETECTED", "MANAGED"]
    }
    if(anomaly.state === 'REDETECTED' ) {
        return ["MANAGED", "IGNORED"]
    }
    return [];
};

const anomalieStateList = computed(() => {
  return anomalies.reduce((acc: Record<string, string>, anomaly: Anomaly) => {
    acc[anomaly.id] = anomaly.state;
    return acc;
  }, {} as Record<string, string>);
});

const filteredDocumentsName = computed(() => {
  const allDocsRefs = anomalies.flatMap((anomaly) => anomaly.docsRef);
  const filteredDocsRefs = allDocsRefs.filter((docRef) =>
    docRef.name.toLowerCase().includes(filterByDocument.value.toLowerCase())
  );
  return [...new Set(filteredDocsRefs.flatMap((docRef)=>docRef.name))];
});

function selectDocument(document: string) {
    filterByDocument.value = document;
    showSearchList.value = false;
}

const groupedDocuments: ComputedRef<Record<string, Anomaly[]>> = computed(() => {
    const groupedList =  anomalies.reduce((acc: Record<string, Anomaly[]>, anomaly: Anomaly) => {
        const docRefPair = [anomaly.docsRef[0].id, anomaly.docsRef[1].id].sort().join('-');
        if (!acc[docRefPair]) {
            acc[docRefPair] = [];
        }
        //make sure docsRef and documents have same order like docRefPair
        anomaly.docsRef.sort((a, b) => a.id.localeCompare(b.id));
        anomaly.documents.sort((a, b) => a.docId.localeCompare(b.docId));
        acc[docRefPair].push(anomaly);
        return acc;
    }, {} as Record<string, Anomaly[]>);
    //filter by filterByDocument.value
    if (filterByDocument.value) {
        return Object.entries(groupedList).filter(([docRefPair, anomalies]) => {
            return anomalies.some((anomaly) => anomaly.docsRef.some((docRef) => docRef.name.includes(filterByDocument.value)));
        }).reduce((acc, [docRefPair, anomalies]) => {
            acc[docRefPair] = anomalies;
            return acc;
        }, {} as Record<string, Anomaly[]>);
    }
    return groupedList;

});

async function setStatus(anomalyId: string, state: string) {
    switch (props.type) {
        case 'conflict':
            await anomalyStore.setConflictState(anomalyId, state.toLowerCase());
            break;
        case 'duplicate':
            await anomalyStore.setDuplicateState(anomalyId, state.toLowerCase());
            break;
    }
}

function getAnomalyById(anomalyId: string): Anomaly | undefined {
    return anomalies.find((anomaly) => anomaly.id === anomalyId);
}

function getAnomalyByDocName(docName: string): Anomaly[] {
    return anomalies.filter((anomaly) => anomaly.docsRef.some((docRef) => docRef.name === docName));
}

async function downloadAllDocs(documentList: Anomaly) {
    for (const el of documentList.docsRef) {
        try {
            await goTo(el);
        } catch (error) {
            console.error('Error downloading file:', el.name, error);
        }
    }
}


async function goTo(file: any) {
    if (file.url.indexOf('/api/orchestrator/files/download') != -1) {
        if (!sdk.value) {
            return;
        }
        const result = await sdk.value.fileInstance().downloadFile(file.name);

        if (result && result.data) {
            const buffer = Buffer.from(result);
            const blob = new Blob([buffer]);
            const url = window.URL.createObjectURL(blob);
            let a = document.createElement('a');
            document.body.appendChild(a);
            a.setAttribute('style', 'display: none');
            a.href = url;
            a.download = file.name;
            a.click();
            window.URL.revokeObjectURL(url);
        }
    } else {
        window.open(file.url, '_blank');
    }
}

</script>

<style lang="scss" scoped>
.anomalie-grouped-by-doc {
    width: 100%;
    .filter-group {
        position: relative;
        width: 50%;
        margin-bottom: 10px;
        
        input {
            width: 100%;
            border-bottom: 1px solid var(--grey-color);
            border-bottom-left-radius: 0px;
            border-bottom-right-radius: 0px;
        }

        .search-item-list {
            position: absolute;
            top: 100%;
            left: 0;
            width: 100%;
            background-color: var(--grey-color);
            border-top: none;
            border-radius: 0 0 4px 4px;
            z-index: 1000;
            box-shadow: 5px 5px 5px rgba(0, 0, 0, 0.3);
            p {
                padding: 8px 12px;
                cursor: pointer;

                &:hover {
                    background-color: var(--grey-4-color);
                }
            }
        }
    }
    .doc-box {
        border-radius: 10px;
        border: 2px solid var(--color-border);
        padding: 10px;
        margin-bottom: 20px;
        background-color: var(--light-black-color);
        overflow: visible;
        .open-doc {
            line-height: 1.6;
            cursor: pointer;
            &:hover {
                color: var(--primary-color);
            }
        }
        .anomalies-table {
            margin-top: 20px;
            width: 100%;
            border-collapse: collapse;
            th {
                height: 50px;
                text-align: center;
                vertical-align: middle;
                background-color: var(--grey-4-color);
                font-weight: bold;
                &:first-child {
                    border-top-left-radius: 10px;
                }
                &:last-child {
                    border-top-right-radius: 10px;
                }
            }

            td {
                text-align: center;
                padding: 10px;
                background-color: var(--light-black-color);
                border-bottom: 1px solid var(--color-border);
                &.id {
                    width: 5%;
                }
                &.subject {
                    width: 10%;
                }
                &.state {
                    width: 104px;
                    .trigger {
                        padding: 7px 0px 0px 14px;
                        width: 80px;
                    }
                    .select-box {
                        width: 104px;
                        margin-bottom: 7px;
                        p {
                            &:hover {
                                color: var(--primary-color);
                            }
                        }
                        &:first-child {
                            margin-top: 7px;
                        }
                        &:last-child {
                            margin-bottom: 0;
                        }
                    }
                }
                &.info {
                    width: 25%;
                }
            }
        }
    }
}
</style>
