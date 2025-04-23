<template lang="pug">
  .document-card
    .top
      p.text-white.text-bold-14 Subject: {{file.subject}}
      .toggle-block
        p.text-white.text-medium-14(v-if="file.state == 'MANAGED' || status == 'MANAGED' || status == 'IGNORED' || file.state == 'IGNORED'"  ) {{status}}
        DropdownSelect(v-else)
            template(#trigger)
                .trigger
                    p.text-white.text-medium-14 {{status}}
            template(#body)
                .select-box(v-for="state in stateList" :key="state")
                    p.text-white.text-medium-14( @click="setStatus(state)"  v-if="state != status") {{state}}

    .information(v-for="(element, index) in informationMerge" :key="index")
      p.text-bold-14.text-white.name(@click="goTo(element)") DOC {{index+1}}: {{element.name}}
      p.text-regular-14.text-white.detail {{element.information_involved}}
    .explanation(v-if="file.explanation")
      p.text-white.text-bold-14 Explanation: 
      p.text-white.text-regular-14 {{file.explanation}}
    .open-all
      .action(@click="downloadAll()")
        p.text-regular-14.text-white Open all these documents
        img.icon-18(src="kai-asset/share.svg" alt="Open all these documents")


</template>

<script setup lang="ts">
import {computed, type ComputedRef, onMounted, ref, type Ref} from "vue";
import {KaiStudio} from "sdk-js";
import Buffer from "vue-buffer";
import axios from "axios";
import DropdownSelect from "./DropdownSelect.vue";
import { useAnomalyStore } from './../store/anomaly';
import {storeToRefs} from 'pinia';

const props = defineProps(['document', 'type'])
const file = props.document
const type = props.type
const informationMerge = ref<any[]>([])

const anomalyStore = useAnomalyStore()
const {sdk} = storeToRefs(anomalyStore)

let status: Ref<string> = ref(file.state)
const stateList: Ref<string[]> = ref(["DETECTED", "MANAGED", "IGNORED"])

async function fetchMergeInformation() {
  const docsRef = file.docsRef
  const documents = file.documents
  let toReturn: any = []
  if (docsRef && documents) {
    docsRef.forEach((docRef: any) => {
      documents.forEach((doc: any) => {
        if (docRef.id == doc.docId) {
          let matchedResult = {
            ...docRef, information_involved: doc.information_involved
          }
          toReturn.push(matchedResult)
        }
      })
    })
  }else if (documents && !docsRef) {
    const coreInstance = sdk.value.core()
    for (const doc of documents){
        const docInfo = await coreInstance.getDocSignature(doc.docId)
        let matchedResult = {
            name: docInfo.name,
            url: docInfo.url,
            information_involved: doc.information_involved
        }
        toReturn.push(matchedResult)
        }
    }
  informationMerge.value = toReturn
}

async function setStatus(state: string) {
    if(file.state == 'MANAGED' || status.value == 'MANAGED') {
        return
    }
    status.value = state
    switch (type) {
        case "conflict":
            await anomalyStore.setConflictState(file.id, state.toLowerCase())
            break;
        case "duplicate":
            await anomalyStore.setDuplicateState(file.id, state.toLowerCase())
            break;
    }
}

async function goTo(file: any) {

if (file.url.indexOf("/api/orchestrator/files/download") != -1) {
  if (!sdk.value) {
      return
  }
  const result = await sdk.value.fileInstance().downloadFile(file.name)

  if (result && result.data) {
    const buffer = Buffer.from(result);
    const blob = new Blob([buffer]);
    const url = window.URL.createObjectURL(blob);
    let a = document.createElement("a");
    document.body.appendChild(a);
    a.setAttribute('style', "display: none")
    a.href = url;
    a.download = file.name;
    a.click();
    window.URL.revokeObjectURL(url);
  }
} else {
  window.open(file.url, '_blank')
}
}

function downloadAll() {
  informationMerge.value.forEach(async el => {
    await goTo(el)
  })
}

onMounted(async () => {
  await fetchMergeInformation()
})

</script>

<style scoped lang="scss">
.document-card {
  border-radius: 10px;
  border: 2px solid var(--color-border);
  margin-bottom: 20px;
  width: calc(100% - 200px);
  padding: 20px;
  background: var(--dark-grey-color);

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;
  }

  .toggle-block {
    .trigger {
        padding: 7px 14px 0px;
        width: 140px;
    }
    .select-box {
        width: 164px;
        padding-left: 14px;
        margin-bottom: 7px;
        p {
            &:hover {
            color: var(--primary-color)
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
  .explanation {
    margin-bottom: 10px;
    }

  .information {
    margin-bottom: 23px;

    .involved-information {
      margin-bottom: 5px;
    }

    .name {
      cursor: pointer;

      &:hover {
        color: var(--primary-color)
      }
    }

    &:last-child {
      margin-bottom: 0;
    }
  }

  .state {
    margin-left: 5px
  }

  .bottom {
    display: flex;
    justify-content: flex-end;
  }

  .detail {
    line-height: 1.3;
    white-space: pre-wrap;
  }

  .open-all {
    display: flex;
    justify-content: flex-end;
    align-items: center;

    .action {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      cursor: pointer;

      p {
        margin-right: 10px;
      }
    }
  }
}
</style>
