<template lang="pug">
  .anomalie-grouped-by-doc
    .filter-group
      input.simple-input-h30(placeholder="Filter by document name" v-model="filterByDocument" @focus="showSearchList = true" @keydown.enter="searchByTitle")
      .search-item-list(v-if="filterByDocument && showSearchList")
        p.text-regular-14.text-white(v-for="document in filteredDocumentsName" :key="document" @click="selectDocument(document)") {{document}}
    .doc-anomalies-container(@scroll="loadMore")
      .doc-anomalies(v-for="(ids, index) in anomaliesIdPairs")
        doc-anomalies(:ids="ids" :type="props.type" :index="index")

</template>

<script setup lang="ts">
import {onMounted, ref, type Ref} from 'vue';
import {useAnomalyStore} from './../store/anomaly';
import {storeToRefs} from 'pinia';
import DocAnomalies from "./../components/DocAnomalies.vue";

const anomalyStore = useAnomalyStore();
const {
  conflictDocIdsList,
  duplicatedDocIdsList
} = storeToRefs(anomalyStore);

const filterByDocument: Ref<string> = ref('');
const showSearchList: Ref<boolean> = ref(false);
const limit: Ref<number> = ref(10);
let offset: Ref<number> = ref(0);

const props = defineProps<{
  type: string;
}>();

function selectDocument(document: string) {
  filterByDocument.value = document;
  showSearchList.value = false;
}

const anomaliesIdPairs = props.type == 'conflict' ? conflictDocIdsList.value : duplicatedDocIdsList.value;

function loadMore(e: any) {
  const el = e.target
  const isBottom = (el.scrollTop + el.clientHeight + 200 >= el.scrollHeight)
  if (isBottom) {
    offset.value = offset.value + limit.value
    anomalyStore.getAnomaliesDocumentPair(props.type, limit.value, offset.value, filterByDocument.value)
  }
}

function searchByTitle() {
  offset.value = 0
  anomalyStore.getAnomaliesDocumentPair(props.type, limit.value, offset.value, filterByDocument.value)
}

onMounted(() => {
  anomalyStore.getAnomaliesDocumentPair(props.type)
});

</script>

<style lang="scss" scoped>
.doc-anomalies-container {
  height: 600px;
  overflow-y: scroll;
}
</style>
