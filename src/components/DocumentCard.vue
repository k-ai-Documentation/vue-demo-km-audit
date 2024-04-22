<template lang="pug">
  .document-card
    .top
      p.text-white.text-bold-14 Subject: {{document.subject}}
      p.text-white
        span.text-regular-14 State:
        span.text-bold-14.state {{document.state}}
    p.information(v-for="element in informationMerge")
      p.text-bold-14.text-white.name(@click="goTo(element)") {{element.name}}
      p.text-bold-14.text-grey.involved-information Involved information:
      p.text-regular-14.text-white {{element.information_involved}}
    .bottom(v-if="document.state != 'MANAGED'")
      button.btn-icon-text(@click="setManaged()") Set managed


</template>

<script setup lang="ts">
import {computed, type ComputedRef} from "vue";
import {KaiStudio} from "sdk-js";

const props = defineProps(['document', 'type', "credentials"])
const document = {...props.document}
const type = props.type

const organizationId = import.meta.env.VITE_APP_ORGANIZATION_ID ?? (props.credentials.organizationId ?? "")
const instanceId = import.meta.env.VITE_APP_INSTANCE_ID ?? (props.credentials.instanceId ?? "")
const apiKey = import.meta.env.VITE_APP_API_KEY ?? (props.credentials.apiKey ?? "")
const host = import.meta.env.VITE_HOST_URL
let sdk: any = null

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

const informationMerge: ComputedRef<any[]> = computed(() => {
  const docsRef = document.docsRef
  const documents = document.documents
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
  switch (type) {
    case "conflict":
      await setConflictManaged(document.id)
      break
    case "duplicate":
      await setDuplicateManaged(document.id)
      break
  }
}

function goTo(element: any) {
  window.open(element.url, '_blank')
}

async function setDuplicateManaged(documentId: number) {
  if (!sdk) {
    return
  }
  let result = await kmAudit.setDuplicatedInformationManaged(documentId)
  if (result) {
    document.state = "MANAGED"
  }
}

async function setConflictManaged(documentId: number) {
  if (!sdk) {
    return
  }
  let result = await kmAudit.setConflictManaged(documentId)
  if (result) {
    document.state = "MANAGED"
  }
}

</script>

<style scoped lang="scss">
.document-card {
  border-radius: 10px;
  border: 2px solid var(--color-border);
  margin-bottom: 20px;
  width: 800px;
  padding: 20px;

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
  }

  .information {
    margin-bottom: 15px;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .state {
    margin-left: 5px
  }

  .name, .involved-information {
    margin-bottom: 5px;
  }

  .name {
    cursor: pointer;

    &:hover {
      color: var(--primary-color)
    }
  }

  .bottom {
    display: flex;
    justify-content: flex-end;
  }
}
</style>
