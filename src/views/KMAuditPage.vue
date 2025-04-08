<template lang="pug">
  .km-audit-page
    Collapse.collapse(:defaultOpen="collapseMenu.documentsToManage" @toggle="toggleCollapseMenu('documentsToManage')")
        template(v-slot:title)
          p.text-white.text-medium-16 Documents to manage
        template(v-slot:body)
            .documents-to-manage(v-if="documentsToManageList && documentsToManageList.length")
                document-list()
            loader.loader-block(v-if="loadingStates.documentsToManage" color="white" )
    Collapse.collapse(:defaultOpen="collapseMenu.conflict" @toggle="toggleCollapseMenu('conflict')")
        template(v-slot:title)
          p.text-white.text-medium-16 Conflicts
        template(v-slot:body)
            related-documents(v-if="conflictDocumentList && conflictDocumentList.length"  :type="'conflict'") 
            loader.loader-block(v-if="loadingStates.conflict" color="white" )
    Collapse.collapse(:defaultOpen="collapseMenu.duplicate" @toggle="toggleCollapseMenu('duplicate')")
        template(v-slot:title)
          p.text-white.text-medium-16 Duplicates
        template(v-slot:body)
            related-documents(v-if="duplicatedDocumentList && duplicatedDocumentList.length" :documentList="duplicatedDocumentList" :credentials="credentials" :type="'duplicate'" :sdkAudit="kmAudit")
            loader.loader-block(v-if="loadingStates.duplicate" color="white" )
    Collapse.collapse(:defaultOpen="collapseMenu.missingSubjects" @toggle="toggleCollapseMenu('missingSubjects')")
        template(v-slot:title)
          p.text-white.text-medium-16 Missing subjects
        template(v-slot:body)
            .missing-subjects(v-if="missingSubjects && missingSubjects.length")
                missing-subject-card(v-for="(element, index) in missingSubjects" :subject="element" :key="index")
            loader.loader-block(v-if="loadingStates.missingSubjects" color="white" )
    p.notification.text-grey.text-regular-14(v-if="showNoResult") No result

</template>

<script setup lang="ts">
import { computed, type ComputedRef, onMounted, ref, type Ref, watch } from 'vue';
import {storeToRefs} from 'pinia';
import { useAnomalyStore } from './../store/anomaly';
import DocumentList from './../components/DocumentList.vue';
import MissingSubjectCard from './../components/MissingSubjectCard.vue';
import Loader from './../components/Loader.vue';
import Collapse from './../components/Collapse.vue';
import RelatedDocuments from './../components/RelatedDocuments.vue';

interface CollapseMenu {
    documentsToManage: boolean;
    conflict: boolean;
    duplicate: boolean;
    missingSubjects: boolean;
}
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
const props = defineProps(['credentials']);
const collapseMenu: Ref<CollapseMenu> = ref({ documentsToManage: false, conflict: false, duplicate: false, missingSubjects: false });

let credentials = { ...props.credentials };

const loadingStates = ref({
    documentsToManage: false,
    conflict: false,
    duplicate: false,
    missingSubjects: false
});

const anomalyStore = useAnomalyStore();

const { conflictInformationList, duplicatedInformationList, documentsToManageList, missingSubjects} = storeToRefs(anomalyStore);

const showNoResult: ComputedRef<boolean> = computed(() => {
    return (
        ((!missingSubjects.value.length && collapseMenu.value.missingSubjects == true) ||
            (!documentsToManageList.value.length && collapseMenu.value.documentsToManage == true) ||
            (!conflictDocumentList.value.length && collapseMenu.value.conflict == true) ||
            (!duplicatedDocumentList.value.length && collapseMenu.value.duplicate == true)) &&
        (loadingStates.value.documentsToManage == false && loadingStates.value.conflict == false && loadingStates.value.duplicate == false && loadingStates.value.missingSubjects == false)
    );
});

const conflictDocumentList: ComputedRef<Anomaly[]> = computed(() => {
    return collapseMenu.value.conflict == true ? conflictInformationList.value : [];
});

const duplicatedDocumentList: ComputedRef<Anomaly[]> = computed(() => {
    return collapseMenu.value.duplicate == true ? duplicatedInformationList.value : [];
});

function toggleCollapseMenu(type: string) {
    collapseMenu.value[type as keyof CollapseMenu] = !collapseMenu.value[type as keyof CollapseMenu];
}

watch(
    () => collapseMenu.value.documentsToManage,
    async (newVal, oldVal) => {
        loadingStates.value.documentsToManage = true
        if (newVal == true && oldVal == false) {
            await anomalyStore.getDocumentsToManageList();
        }else{
            anomalyStore.resetDocumentsToManage();
        }
        loadingStates.value.documentsToManage = false
    }
);

watch(
    () => collapseMenu.value.conflict,
    async (newVal, oldVal) => {
        loadingStates.value.conflict = true
        if (newVal == true && oldVal == false) {
            await anomalyStore.getConflictInformation();
        }else {
            anomalyStore.resetConflict();
        }
        loadingStates.value.conflict = false
    }
);

watch(
    () => collapseMenu.value.duplicate,
    async (newVal, oldVal) => {
        loadingStates.value.duplicate = true
        if (newVal == true && oldVal == false) {
            await anomalyStore.getDuplicatedInformation();
        }else {
            anomalyStore.resetDuplicated();
        }
        loadingStates.value.duplicate = false
    }
);

watch(
    () => collapseMenu.value.missingSubjects,
    async (newVal, oldVal) => {
        loadingStates.value.missingSubjects = true
        if (newVal == true && oldVal == false) {
            await anomalyStore.getMissingSubjectList();
        }else{
            anomalyStore.resetMissingSubjects();
        }
        loadingStates.value.missingSubjects = false
    }
);

onMounted( async()=> {
    loadingStates.value.documentsToManage = true
    const organizationId = import.meta.env.VITE_APP_ORGANIZATION_ID ?? credentials.organizationId ?? '';
    const instanceId = import.meta.env.VITE_APP_INSTANCE_ID ?? credentials.instanceId ?? '';
    const apiKey = import.meta.env.VITE_APP_API_KEY ?? credentials.apiKey ?? '';
    const host = import.meta.env.VITE_HOST_URL;
    await anomalyStore.init(organizationId, instanceId, apiKey, host);
    loadingStates.value.documentsToManage = false
})
</script>

<style scoped lang="scss">
.collapse{
  margin-bottom: 40px;
}
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
                vertical-align: middle;
            }
        }
    }

    th,
    td {
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

.loader-block {
    display: flex;
    align-items: center;
    justify-content: center;
}
</style>
