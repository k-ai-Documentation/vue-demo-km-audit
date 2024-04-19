<template lang="pug">
  .document-card
    .top
      p.text-white.text-bold-14 Subject: {{document.subject}}
      p.text-white
        span.text-regular-14 State:
        span.text-bold-14.state {{document.state}}
    p.information(v-for="element in informationMerge")
      p.text-bold-14.text-white.name {{element.name}}
      p.text-bold-14.text-grey.involved-information Involved information:
      p.text-regular-14.text-white {{element.information_involved}}
    .bottom(v-if="document.state != 'MANAGED'")
      button.btn-icon-text(@click="setManaged()") Set managed


</template>

<script setup lang="ts">
import {computed, type ComputedRef} from "vue";
import {useAuditStore} from "@/stores/AuditStore";

const pros = defineProps(['document', 'type'])
const document = pros.document
const type = pros.type
const auditStore = useAuditStore()

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
      await auditStore.setConflictManaged(document.id)
      break
    case "duplicate":
      await auditStore.setDuplicateManaged(document.id)
      break
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

  .bottom {
    display: flex;
    justify-content: flex-end;
  }
}
</style>