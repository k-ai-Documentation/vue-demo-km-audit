<template lang="pug">
  .document-list(v-if="documentsToManageList.length")
    table.files
      thead
        tr
          th.text-medium-14.text-grey Name
          th
            .orderby-thead(@click="orderby('count_conflicts')")
                p.text-medium-14.text-grey Conflicts number
                img(:src="dropdown" v-if="orderType == 'count_conflicts'" :class="orderDirection == 'asc' ? 'inversed': ''")
          th
            .orderby-thead(@click="orderby('count_duplicates')")
                p.text-medium-14.text-grey Duplicates number
                img(:src="dropdown" v-if="orderType == 'count_duplicates'" :class="orderDirection == 'asc' ? 'inversed': ''")
      tbody
        tr(v-for="(file, index) in documentsToManageList" :key="file.name")
          td.name-td(width=576)
            p.text-white.text-regular-14(@click="showFileAnomalies(file)") {{ file.name }}
          td.conflict(width=300)
            p.text-white.text-regular-14 {{ file.count_conflicts }}
          td.duplicate(width=300)
            p.text-white.text-regular-14 {{ file.count_duplicates }}
          td.download(width=50)
            img(src="kai-asset/share.svg" @click="goTo(file)")

    .modal-container(v-if="showModal")
        .modal-bg(@click="closeModal()")
        ModalTemplate.modal(@closeModal="closeModal()")
            template(#header)
                p.text-white.text-bold-16 Document anomalies (Conflicts and Duplicates)
            template(#body)
                .conflicts(v-if="anomalies && anomalies['conflicts'].length>0")
                    p.text-white.text-bold-16.title Document Conflicts 
                    document-card.document-card(v-for="document of anomalies['conflicts']" :document="document" :key="document.id" :type="'conflict'")
                .duplicates(v-if="anomalies && anomalies['duplicated'].length>0")
                    p.text-white.text-bold-16.title Document Duplicates
                    document-card.document-card(v-for="document of anomalies['duplicated']" :document="document" :key="document.id" :type="'duplicate'")

</template>

<script setup lang="ts">
import Buffer from "vue-buffer"
import axios from 'axios'
import dropdown from 'kai-asset/icons/dropdown.svg'
import ModalTemplate from "./ModalTemplate.vue"
import { onMounted, ref } from "vue"
import {KaiStudio} from "sdk-js";
import DocumentCard from "./DocumentCard.vue"

import { useAnomalyStore } from './../store/anomaly';
import {storeToRefs} from 'pinia';

const anomalyStore = useAnomalyStore();

const {documentsToManageList, sdk} = storeToRefs(anomalyStore);

const orderType = ref('count_conflicts')
const orderDirection = ref('asc')

const showModal = ref(false)
const modalFileId = ref('')
const anomalies = ref({})


async function showFileAnomalies(file: any) {
    if (!sdk.value) { 
        return
    }
    anomalies.value = await sdk.value.auditInstance().getAnomaliesForDoc(file.id)
    modalFileId.value = file.id
    showModal.value = true
}

function orderby(type: string) {
    if (orderType.value != type) {
        orderDirection.value = 'desc'
    }else {
        orderDirection.value = orderDirection.value == 'asc' ? 'desc' : 'asc'
    }
    orderType.value = type
    documentsToManageList.value.sort((a: any, b: any) => {
        if (orderDirection.value == 'asc') {
            return a[type] - b[type]
        } else {
            return b[type] - a[type]
        }
    })
}

function closeModal() {
    showModal.value = false
    anomalies.value = {}
    modalFileId.value = ''
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

onMounted(() => {
    orderby('count_conflicts')
})
</script>

<style scoped lang="scss">
.files {
  width: 100%;
  thead {
    th {
      height: 3rem;
      line-height: 3rem;
      min-width: 15%;
      text-align: left;
      .orderby-thead{
        display: flex;
        cursor: pointer;
      }
    }
    img {
        filter: var(--svg-filter-white-color);

        &.inversed {
            transform: rotate(180deg);
        
        }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid var(--color-border);

      td {
        height: 60px;
        vertical-align: middle;
        &.name-td {
          p {
            cursor: pointer;
            &:hover {
                color: var(--primary-color);
            }
          }
          
        }
        &.download {
          cursor: pointer;
        }
      }
    }
  }
}
.modal-container {
  z-index: 3500;
  position: absolute;
  top: 0px;
  left: 0px;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  .modal-bg {
    position: absolute;
    top: 0px;
    left: 0px;
    width: 100%;
    height: 100%;
    z-index: 3501;
    background-color: black;
    opacity: 0.9;
  }

  .modal {
    z-index: 3502;
    max-height: 80%;
    background-color: var(--color-border);
    overflow-y: scroll;
    .title{
        margin-bottom: 15px;
        padding-left: 20px;
    }
    .document-card{
        width: 100%;
    }
  }
}
</style>
