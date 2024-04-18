<template lang="pug">
  .km-audit-page
    .header.text-regular-32.text-white KM Audit Demo
    .tabs
      p.text-regular-16(:class="{ active: menu == 'toManage' }" @click="menu = 'toManage'") Documents to manage
      p.text-regular-16(:class="{ active: menu == 'conflict' }"  @click="menu = 'conflict'") Conflict information
      p.text-regular-16(:class="{ active: menu == 'duplicate' }" @click="menu = 'duplicate'") Duplicate information
    .documents-to-manage(v-if="menu == 'toManage'")
      .text-white.text-bold-20.sub-title Documents to manage
      document-list(:document-list="documentsToManageList" :key="'document_to_manage_list_' + documentsToManageList.length")
    .conflict-documents(v-if="menu == 'conflict'")
      .text-white.text-bold-20.sub-title Conflict information
      document-card.document-card(v-for="(element, index) in conflictInformationList" :document="element" :key="index" type="conflict")
    .duplicate-documents(v-if="menu == 'duplicate'")
      .text-white.text-bold-20.sub-title Duplicate information
      document-card.document-card(v-for="(element, index) in duplicatedInformationList" :document="element" :key="index" type="duplicate")
    .all-documents(v-if="menu == 'all'")
</template>

<script setup lang="ts">
import {onMounted, ref, type Ref} from "vue";
import DocumentCard from "@/components/DocumentCard.vue";
import {useAuditStore} from "@/stores/AuditStore";
import {storeToRefs} from "pinia";
import DocumentList from "@/components/DocumentList.vue";

const menu: Ref<string> = ref('toManage')
const auditStore = useAuditStore()

const {conflictInformationList, duplicatedInformationList, documentsToManageList} = storeToRefs(auditStore)

onMounted(async () => {
  await auditStore.getDocumentsToManageList(20, 0)
  await auditStore.getConflictInformation(20, 0)
  await auditStore.getDuplicatedInformation(20, 0)
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
</style>
