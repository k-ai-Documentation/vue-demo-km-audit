<template lang="pug">
  .document-card
    .top
      p.text-white.text-bold-14 Subject: {{file.subject}}
      .toggle-block(@click="setManaged()")
        p.text-white.text-regular-12 Detected
        .toggle(:class= "{'checked': status == 'MANAGED'}")
          .circle
        p.text-white.text-regular-12 Managed
    .information(v-for="element in informationMerge")
      p.text-bold-14.text-white.name(@click="goTo(element)") {{element.name}}
      p.text-regular-14.text-grey.involved-information Involved information:
      p.text-regular-14.text-white.detail {{element.information_involved}}
    .open-all
      .action(@click="downloadAll()")
        p.text-regular-14.text-white Open all this documents
        img.icon-18(src="@/assets/share.svg" alt="Open all this documents")


</template>

<script setup lang="ts">
import {computed, type ComputedRef, ref, type Ref} from "vue";
import {KaiStudio} from "sdk-js";
import Buffer from "vue-buffer";
import axios from "axios";

const props = defineProps(['document', 'type', "credentials"])
const file = props.document
const credentials = props.credentials
const type = props.type

const organizationId = import.meta.env.VITE_APP_ORGANIZATION_ID ?? (credentials.organizationId ?? "")
const instanceId = import.meta.env.VITE_APP_INSTANCE_ID ?? (credentials.instanceId ?? "")
const apiKey = import.meta.env.VITE_APP_API_KEY ?? (credentials.apiKey ?? "")
const host = import.meta.env.VITE_HOST_URL
let sdk: any = null
let status: Ref<string> = ref(file.state)

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

const informationMerge: ComputedRef<any[]> = computed(() => {
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
  }
  return toReturn
})

async function setManaged() {
  status.value = "MANAGED"
  switch (type) {
    case "conflict":
      await setConflictManaged(file.id)
      break
    case "duplicate":
      await setDuplicateManaged(file.id)
      break
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

async function setDuplicateManaged(documentId: number) {
  if (!sdk) {
    return
  }
  await kmAudit.setDuplicatedInformationManaged(documentId)
  file.state = "MANAGED"
}

async function setConflictManaged(documentId: number) {
  if (!sdk) {
    return
  }
  await kmAudit.setConflictManaged(documentId)
  file.state = "MANAGED"
}

function downloadAll() {
  informationMerge.value.forEach(async el => {
    await goTo(el)
  })
}

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
    display: flex;
    align-items: center;

    .toggle {
      width: 40px;
      height: 20px;
      margin: 0 10px;
      display: flex;
      align-items: center;
      background: var(--grey-color);
      border-radius: 25px;
      cursor: pointer;
      padding: 5px;

      &.checked {
        justify-content: flex-end;
        background-color: var(--primary-color);
      }

      .circle {
        height: 12px;
        width: 12px;
        border-radius: 100%;
        background: var(--white-color);
      }
    }
  }

  .information {
    margin-bottom: 23px;

    .involved-information {
      margin-bottom: 5px;
    }

    .name {
      cursor: pointer;
      margin-bottom: 8px;

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
