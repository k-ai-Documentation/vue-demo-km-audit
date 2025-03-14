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
    .explanation
      p.text-white.text-bold-14(v-if="file.explanation") Explanation: 
      p.text-white.text-regular-14(v-if="file.explanation") {{file.explanation}}
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

const props = defineProps(['document', 'type', "credentials"])
const file = props.document
const credentials = props.credentials
const type = props.type
const informationMerge = ref<any[]>([])

const organizationId = import.meta.env.VITE_APP_ORGANIZATION_ID ?? (credentials.organizationId ?? "")
const instanceId = import.meta.env.VITE_APP_INSTANCE_ID ?? (credentials.instanceId ?? "")
const apiKey = import.meta.env.VITE_APP_API_KEY ?? (credentials.apiKey ?? "")
const host = import.meta.env.VITE_HOST_URL
let sdk: any = null
let status: Ref<string> = ref(file.state)
const stateList: Ref<string[]> = ref(["DETECTED", "MANAGED", "IGNORED"])

if (organizationId && instanceId && apiKey) {
  sdk = new KaiStudio({
    organizationId: organizationId,
    instanceId: instanceId,
    apiKey: apiKey
  })
} else if (host) {
  sdk = new KaiStudio({
    host: host,
    apiKey: apiKey
  })
}

const kmAudit = sdk?.auditInstance()

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
    const searchInstance = sdk?.search()
    for (const doc of documents){
        const docInfo = await searchInstance.getDocSignature(doc.docId)
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
            await setConflictState(file.id, state.toLowerCase())
            break;
        case "duplicate":
            await setDuplicateState(file.id, state.toLowerCase())
            break;
    }
}

async function goTo(file: any) {

  if (file.url.indexOf("/api/orchestrator/files/download") != -1) {

    let hostUrl = import.meta.env.VITE_HOST_URL
    let baseUrl = ""
    let headers = {}

    if (hostUrl) {
      baseUrl = import.meta.env.VITE_HOST_URL
      headers = {
        'Content-Type': 'application/json',
      }

    } else if (credentials && credentials.organizationId && credentials.instanceId) {
      baseUrl = `https://${credentials.organizationId}.kai-studio.ai/${credentials.instanceId}`
      headers = {
        'organization-id': credentials.organizationId,
        'instance-id': credentials.instanceId,
        'api-key': credentials.apiKey
      }
    }

    if (!baseUrl) {
      return
    }

    const result = await axios({
      url: `${baseUrl}` + file.url,
      method: 'POST',
      headers: headers
    })

    if (result && result.data) {
      const buffer = Buffer.from(result.data.response);
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

async function setConflictState(documentId: string, state: string) {
  if (!sdk) {
    return
  }
  await kmAudit.conflictInformationSetState(documentId, state)
  file.state = state
}

async function setDuplicateState(documentId: number, state: string) {
  if (!sdk) {
    return
  }
  await kmAudit.duplicatedInformationSetState(documentId, state)
  file.state = state
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
        width: 178px;
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
