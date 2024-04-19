<template lang="pug">
  .km-audit-page
    .header.text-regular-32.text-white KM Audit Demo
    .tabs
      p.text-regular-16(:class="{ active: menu == 'toManage' }" @click="menu = 'toManage'") Documents to manage
      p.text-regular-16(:class="{ active: menu == 'conflict' }"  @click="menu = 'conflict'") Conflict information
      p.text-regular-16(:class="{ active: menu == 'duplicate' }" @click="menu = 'duplicate'") Duplicate information
      p.text-regular-16(:class="{ active: menu == 'subject' }" @click="menu = 'subject'") Missing subjects
    .documents-to-manage(v-if="menu == 'toManage' && loaded")
      .text-white.text-bold-20.sub-title Documents to manage
      document-list(:document-list="documentsToManageList" :key="'document_to_manage_list_' + documentsToManageList.length")
    .related-documents(v-if="(menu == 'conflict' || menu == 'duplicate') && loaded")
      .top
        .text-white.text-bold-20.sub-title {{menu == 'conflict' ? "Conflict information" : "Duplicate information"}}
        DropdownSelect.filter(v-if="typeList && relatedDocumentList.length")
          template(#trigger)
            div.selected-type
              p.text-regular-14.text-white {{ selectedType }}
          template(#body)
            .document-type
              p.text-white.text-medium-14(v-for="type in otherTypes" @click="selectedType = type") {{ type }}
      document-card.document-card(v-for="(element, index) in documentsToShow" :document="element" :key="element.subject + '_' + element.status" :type="menu")
    .missing-subjects(v-if="menu == 'subject' && loaded")
      .text-white.text-bold-20.sub-title Missing subjects
      missing-subject-card(v-for="(element, index) in missingSubjects" :subject="element" :key="index")
    .loader-block(v-if="!loaded" )
      loader.loader(color="white" )
    p.notification.text-grey.text-regular-12(v-if="(!documentsToShow.length || !documentsToManageList.length || !relatedDocumentList.length) && loaded") No result

</template>

<script setup lang="ts">
import {computed, type ComputedRef, ref, type Ref, watch} from "vue";
import DocumentCard from "@/components/DocumentCard.vue";
import {useAuditStore} from "@/stores/AuditStore";
import {storeToRefs} from "pinia";
import DocumentList from "@/components/DocumentList.vue";
import MissingSubjectCard from "@/components/MissingSubjectCard.vue";
import DropdownSelect from "@/components/DropdownSelect.vue";
import Loader from "@/components/Loader.vue";

const menu: Ref<string> = ref('toManage')
const selectedType: Ref<string> = ref('All')
const loaded: Ref<boolean> = ref(false)
const auditStore = useAuditStore()
const typeList: Ref<string[]> = ref(["All", "Managed", "Detected"])

const {
  conflictInformationList,
  duplicatedInformationList,
  documentsToManageList,
  missingSubjects
} = storeToRefs(auditStore)

watch(menu, async () => {
  selectedType.value = "All"
  loaded.value = false
  switch (menu.value) {
    case "toManage":
      await auditStore.getDocumentsToManageList(20, 0)
      break
    case "conflict":
      await auditStore.getConflictInformation(20, 0)
      break
    case "duplicate":
      await auditStore.getDuplicatedInformation(20, 0)
      break
    case "subject":
      await auditStore.getMissingSubjectList(20, 0)
      break
  }
  loaded.value = true
}, {deep: true, immediate: true})


const otherTypes: ComputedRef<string[]> = computed(() => {
  return typeList.value.filter((t: string) => t != selectedType.value)
})

const relatedDocumentList: ComputedRef<string[]> = computed(() => {
  return menu.value == 'conflict' ? conflictInformationList.value : duplicatedInformationList.value
})

const documentsToShow: ComputedRef<any[]> = computed(() => {
  if (selectedType.value == 'All') {
    return relatedDocumentList.value
  }

  return relatedDocumentList.value.filter((document:any) => {
    return document.state == selectedType.value.toUpperCase()
  })
})

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
  .top {
    display: flex;
    justify-content: space-between;
    width: 800px;
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
</style>
