<template lang="pug">
  .anomalies(:key="props.type")
    table
      thead
        tr
          th
            p.text-medium-14.text-grey Ranking
          th
            p.text-medium-14.text-grey Subject
          th
            p.text-medium-14.text-grey Occurrences
      tbody
        tr(v-for="(subject, index) in topSubjects[props.type]" :key="subject.subject")
          td
            p.text-white.text-regular-14 {{ index + 1 }}
          td
            p.text-white.text-regular-14.subject( @click="showModal = true; getfilteredAnomalies(subject.subject)") {{ subject.subject }}
          td
            p.text-white.text-regular-14 {{ subject.count }}

    .modal-container(v-if="showModal")
      .modal-bg(@click="closeModal()")
      ModalTemplate.modal(@closeModal="closeModal()")
        template(#header)
          p.text-white.text-bold-16 {{type.charAt(0).toUpperCase() + type.slice(1)}} documents
        template(#body)
          .docs(v-if="filterdAnomalies && filterdAnomalies.length > 0")
            document-card.document-card(v-for="document of filteredAnomalies" :document="document" :key="document.id" :type="props.type")


</template>

<script setup lang="ts">
import {type Ref, ref} from 'vue';
import ModalTemplate from './ModalTemplate.vue';
import DocumentCard from './DocumentCard.vue';

import {useAnomalyStore} from './../store/anomaly';
import {storeToRefs} from 'pinia';

const anomalyStore = useAnomalyStore();
const {topSubjects} = storeToRefs(anomalyStore);

interface Document {
  docsRef: any[];
  documents: any[];
  explanation: string;
  id: string;
  state: string;
  subject: string;
}

const props = defineProps<{
  type: string;
}>();

const showModal = ref(false);
const filteredAnomalies = ref<Document[]>([]);
const anomalies: Ref<any[]> = ref([])

const getfilteredAnomalies = (subject: string) => {
  filteredAnomalies.value = anomalies.value.filter((doc: any) => doc.subject === subject);
};

function closeModal() {
  showModal.value = false;
}


</script>

<style lang="scss" scoped>
.anomalies {
  width: 100%;

  table {
    width: 60%;
  }

  tbody {
    tr {
      border-bottom: 1px solid var(--color-border);

      td {
        height: 60px;
        vertical-align: middle;
        text-align: center;

        p.subject {
          cursor: pointer;

          &:hover {
            color: var(--primary-color);
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
      height: fit-content;
      vertical-align: middle;
      background-color: var(--color-border);
      margin: auto;
      overflow-y: scroll;

      .title {
        margin-bottom: 15px;
        padding-left: 20px;
      }

      .document-card {
        width: 100%;
      }
    }
  }
}
</style>
