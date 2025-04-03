<template lang="pug">
.anomalie-grouped-by-doc
    .doc-box(v-for="(documentList, index) in Object.values(groupedDocuments)" :key="documentList")
        p.text-bold-16.text-white Two related documents \#{{index + 1}}
        p.text-regular-14.text-white {{documentList[0].docsRef[0].name}}
        p.text-regular-14.text-white {{documentList[0].docsRef[1].name}}
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
                            p.text-white.text-medium-14(v-if="anomaly.state == 'MANAGED' || anomalieStateList[anomaly.id] == 'MANAGED' || anomalieStateList[anomaly.id] == 'IGNORED' || anomaly.state == 'IGNORED'"  ) {{anomalieStateList[anomaly.id]}}
                            DropdownSelect(v-else)
                                template(#trigger)
                                    .trigger
                                        p.text-white.text-medium-14 {{anomaly.state}}
                                template(#body)
                                    .select-box(v-for="state in stateList" :key="state")
                                        p.text-white.text-medium-14( @click="setStatus(anomaly.id, state)"  v-if="state != anomalieStateList[anomaly.id]") {{state}}
                        td.text-regular-14.text-white.info {{anomaly.documents[0].information_involved}}
                        td.text-regular-14.text-white.info {{anomaly.documents[1].information_involved}}
                        td.text-regular-14.text-white {{anomaly.explanation}}

</template>

<script setup lang="ts">
import { ref, computed,onMounted, type ComputedRef, type Ref } from 'vue';
import DropdownSelect from './DropdownSelect.vue';

import { useAnomalyStore } from './../store/anomaly';
import {storeToRefs} from 'pinia';

const anomalyStore = useAnomalyStore();
const { conflictInformationList, duplicatedInformationList } = storeToRefs(anomalyStore);

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

const stateList: Ref<string[]> = ref(['DETECTED', 'MANAGED', 'IGNORED']);

const anomalieStateList = computed(() => {
  return anomalies.reduce((acc: Record<string, string>, anomaly: Anomaly) => {
    acc[anomaly.id] = anomaly.state;
    return acc;
  }, {} as Record<string, string>);
});

const groupedDocuments = computed(() => {
    return anomalies.reduce((acc: Record<string, Anomaly[]>, anomaly: Anomaly) => {
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
});

async function setStatus(anomalyId: string, state: string) {
    if (getAnomalyById(anomalyId)?.state == 'MANAGED' || anomalieStateList.value[anomalyId] == 'MANAGED') {
        return;
    }
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


</script>

<style lang="scss" scoped>
.anomalie-grouped-by-doc {
    width: 100%;
    .doc-box {
        border-radius: 10px;
        border: 2px solid var(--color-border);
        padding: 10px;
        margin-bottom: 20px;
        background-color: var(--light-black-color);
        overflow: visible;
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
