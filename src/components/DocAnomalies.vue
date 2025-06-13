<template lang="pug">
  .docs-anomalies
    p.text-bold-16.text-white.open-doc(@click="downloadAllDocs()") Two related documents \#{{props.index + 1}}
    p.text-regular-14.text-white.open-doc(@click="goTo(firstFile)" v-if="firstFile") {{firstFile.name}}
    p.text-regular-14.text-white.open-doc(@click="goTo(secondFile)" v-if="secondFile" ) {{secondFile.name}}
    .anomalies-table(v-if="anomalies && anomalies.length")
      table
        thead
          tr
            th.text-bold-14.text-white Subject
            th.text-bold-14.text-white Status
            th
              p.text-bold-14.text-white Information Involved for
              p.text-bold-14.text-white {{}}
            th
              p.text-bold-14.text-white Information Involved for
              p.text-bold-14.text-white {{}}
            th.text-bold-14.text-white Explanation
        tbody
          tr(v-for="anomaly in anomalies" :key="anomaly.id")
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
import {onMounted, ref, type Ref} from 'vue';
import DropdownSelect from './DropdownSelect.vue';
import Buffer from 'vue-buffer';
import {useAnomalyStore} from './../store/anomaly';
import {storeToRefs} from 'pinia';

const anomalyStore = useAnomalyStore();
const props = defineProps(["ids", "type", "index"])

const {
  sdk,
} = storeToRefs(anomalyStore);

const filterByDocument: Ref<string> = ref('');
const showSearchList: Ref<boolean> = ref(false);
const anomalies: Ref<any> = ref([]);
const firstFile: Ref<any> = ref(false);
const secondFile: Ref<any> = ref(false);

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

const stateList: Ref<string[]> = ref(["DETECTED", "MANAGED", "IGNORED", "DISAPPEARED", "REDETECTED"])

const getAvailableStateList = (anomaly: Anomaly): string[] => {
  if (!anomaly) return [];

  if (anomaly.state === 'MANAGED') {
    return ["DETECTED", "IGNORED"]
  }
  if (anomaly.state === 'DETECTED') {
    return ["MANAGED", "IGNORED"]
  }
  if (anomaly.state === 'IGNORED') {
    return ["DETECTED", "MANAGED"]
  }
  if (anomaly.state === 'REDETECTED') {
    return ["MANAGED", "IGNORED"]
  }
  return [];
};

function setStatus(anomalyId: string, state: string) {
  switch (props.type) {
    case 'conflict':
      anomalyStore.setConflictState(anomalyId, state.toLowerCase());
      break;
    case 'duplicate':
      anomalyStore.setDuplicateState(anomalyId, state.toLowerCase());
      break;
  }
}

async function downloadAllDocs() {
  try {
    await goTo(firstFile.value);
    await goTo(secondFile.value);
  } catch (error) {
    console.error('Error downloading file:', error);
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

onMounted(async () => {
  anomalies.value = await anomalyStore.getAnomaliesByDocumentIds(props.ids, props.type)
  firstFile.value = await anomalyStore.getDocument(props.ids[0])
  secondFile.value = await anomalyStore.getDocument(props.ids[1])
});

</script>

<style lang="scss" scoped>
.docs-anomalies {
  width: 100%;
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
</style>
