<template lang="pug">
  .km-audit-page
    .tabs
      p.text-regular-14(:class="{ active: menu == 'toManage' }" @click="menu = 'toManage'") Documents to manage
      p.text-regular-14(:class="{ active: menu == 'conflict' }"  @click="menu = 'conflict'") Conflict information
      p.text-regular-14(:class="{ active: menu == 'duplicate' }" @click="menu = 'duplicate'") Duplicate information
      p.text-regular-14(:class="{ active: menu == 'subject' }" @click="menu = 'subject'") Missing subjects
    .documents-to-manage(v-if="menu == 'toManage' && loaded")
      document-list(:document-list="documentsToManageList" :key="'document_to_manage_list_' + documentsToManageList.length" :credentials="credentials")
    .related-documents(v-if="(menu == 'conflict' || menu == 'duplicate') && loaded")
      .top(v-if="typeList && relatedDocumentList.length")
        DropdownSelect.filter
          template(#trigger)
            div.selected-type
              p.text-regular-14.text-white {{ selectedType }}
          template(#body)
            .document-type
              p.text-white.text-medium-14(v-for="type in otherTypes" @click="selectedType = type") {{ type }}
      document-card.document-card(v-for="(element, index) in documentsToShow" :document="element" :key="element.subject + '_' + element.status" :type="menu" :credentials="credentials")
    .missing-subjects(v-if="menu == 'subject' && loaded")
      missing-subject-card(v-for="(element, index) in missingSubjects" :subject="element" :key="index")
    .loader-block(v-if="!loaded" )
      loader.loader(color="white" )
    p.notification.text-grey.text-regular-14(v-if="showNoResult") No result

</template>

<script setup lang="ts">
import {computed, type ComputedRef, ref, type Ref, watch} from "vue";
import DocumentCard from "./../components/DocumentCard.vue";
import DocumentList from "./../components/DocumentList.vue";
import MissingSubjectCard from "./../components/MissingSubjectCard.vue";
import DropdownSelect from "./../components/DropdownSelect.vue";
import Loader from "./../components/Loader.vue";
import {KaiStudio} from "sdk-js";

const menu: Ref<string> = ref('toManage')
const selectedType: Ref<string> = ref('All')
const loaded: Ref<boolean> = ref(false)
const props = defineProps(["credentials"])
const typeList: Ref<string[]> = ref(["All", "Managed", "Detected"])

let conflictInformationList: Ref<any[]> = ref([]);
let duplicatedInformationList: Ref<any[]> = ref([]);
let documentsToManageList: Ref<any[]> = ref([]);
let missingSubjects: Ref<any[]> = ref([]);
let credentials = {...props.credentials}

const organizationId = import.meta.env.VITE_APP_ORGANIZATION_ID ?? (credentials.organizationId ?? "")
const instanceId = import.meta.env.VITE_APP_INSTANCE_ID ?? (credentials.instanceId ?? "")
const apiKey = import.meta.env.VITE_APP_API_KEY ?? (credentials.apiKey ?? "")
const host = import.meta.env.VITE_HOST_URL
let sdk: any = null

credentials = {
  organizationId: organizationId ?? '',
  instanceId: instanceId ?? '',
  apiKey: apiKey ?? '',
  host: host ?? ''
}

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

watch(menu, async () => {
  selectedType.value = "All"
  loaded.value = false
  switch (menu.value) {
    case "toManage":
      await getDocumentsToManageList(20, 0)
      break
    case "conflict":
      await getConflictInformation(20, 0)
      break
    case "duplicate":
      await getDuplicatedInformation(20, 0)
      break
    case "subject":
      await getMissingSubjectList(20, 0)
      break
  }
  loaded.value = true
}, {deep: true, immediate: true})


const otherTypes: ComputedRef<string[]> = computed(() => {
  return typeList.value.filter((t: string) => t != selectedType.value)
})

const showNoResult: ComputedRef<boolean> = computed(() => {
  return ((!missingSubjects.value.length && (menu.value == 'subject')) ||
      (!documentsToManageList.value.length && menu.value == 'toManage') ||
      (!relatedDocumentList.value.length && (menu.value == 'conflict' || menu.value == 'duplicate'))) && loaded.value
})

const relatedDocumentList: ComputedRef<string[]> = computed(() => {
  return menu.value == 'conflict' ? conflictInformationList.value : duplicatedInformationList.value
})

const documentsToShow: ComputedRef<any[]> = computed(() => {
  if (selectedType.value == 'All') {
    return relatedDocumentList.value
  }

  return relatedDocumentList.value.filter((document: any) => {
    return document.state == selectedType.value.toUpperCase()
  })
})

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


async function getMissingSubjectList(limit: number, initialOffset: number) {
  if (!sdk) {
    return
  }

  if (initialOffset == 0) {
    missingSubjects.value = []
  }

  let offset = initialOffset
  let result = await kmAudit.getMissingSubjectList(20, offset)
  if (result) {
    for (let index = 0; index < result.length; index++) {
      let subject = result[index]
      if (subject) {
        missingSubjects.value.push(subject)
      }
    }
  }
  if (result && result.length == limit) {
    offset = offset + limit
    await getMissingSubjectList(limit, offset)
  }
}

</script>

<style scoped lang="scss">
.tabs {
  display: flex;
  flex-direction: row;
  margin: 50px 0;

  p {
    cursor: pointer;
    margin-right: 40px;
    border-bottom: 2px solid transparent;
    display: flex;
    flex-direction: row;
    align-items: center;
    color: var(--grey-color);
    padding-bottom: 5px;

    &.active {
      border-bottom: 2px solid var(--primary-color);
      color: var(--white-color);

      img {
        filter: var(--svg-filter-white-color)
      }
    }
  }
}

.sub-title {
  margin-bottom: 20px;
  margin-top: 20px;
}

.document-list {
  width: 100%;
  background-color: var(--color-background-mute);
  border-radius: 5px;

  tbody {
    tr {
      border-bottom: 1px solid var(--color-border);

      td {
        height: 50px;
        vertical-align: middle
      }
    }
  }

  th, td {
    text-align: left;
    padding: 10px 0;
  }

  .document-title {
    p {
      margin-bottom: 10px;
      width: 360px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .actions {
    display: flex;
    flex-direction: column;

    button {
      width: fit-content;
      margin-bottom: 5px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }
}

.related-documents {
  margin-top: -50px;

  .top {
    display: flex;
    justify-content: flex-end;
    width: calc(100% - 200px);
    height: 32px;
    align-items: center;
    margin-bottom: 20px;
  }

  .filter {
    .selected-type {
      width: 140px;
      padding: 14px 0 14px 14px;

      img {
        filter: var(--svg-filter-white-color)
      }
    }

    .document-type {
      width: 178px;
      padding: 0 14px 14px;

      p {
        margin-bottom: 14px;

        &:first-letter {
          text-transform: capitalize;
        }

        &:last-child {
          margin-bottom: 0;
        }

        &:hover {
          color: var(--primary-color)
        }
      }
    }
  }
}

.loader-block {
  display: flex;
  align-items: center;
  height: 60vh;
  justify-content: center;
}

.notification {
  padding-top: 40px
}
</style>
