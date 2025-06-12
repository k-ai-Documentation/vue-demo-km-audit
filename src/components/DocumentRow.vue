<template lang="pug">
  tr.document-row(:key="fileInfo.name")
    td.name-td(width=576)
      div.file-name-loader(v-if="!fileInfo")
        span
      p.text-white.text-regular-14(@click="showFileAnomalies(file)" v-else ) {{ fileInfo.name }}
    td.conflict(width=300)
      p.text-white.text-regular-14 {{ file.count_conflicts }}
    td.duplicate(width=300)
      p.text-white.text-regular-14 {{ file.count_duplicates }}
    td.download(width=50)
      img(src="kai-asset/share.svg" @click="goTo()")

</template>

<script setup lang="ts">
import Buffer from "vue-buffer"

import {useAnomalyStore} from './../store/anomaly';
import {storeToRefs} from 'pinia';
import {ref, type Ref} from "vue";

const anomalyStore = useAnomalyStore();

const pros = defineProps(['file'])
const file = pros.file

const {sdk} = storeToRefs(anomalyStore);
const fileInfo: Ref<any> = ref(false)

async function getFile(id: string) {
  fileInfo.value = await anomalyStore.getDocument(id) ?? false
}

function goTo() {
  let file = fileInfo.value
  if (file.url.indexOf("/api/orchestrator/files/download") != -1) {
    if (!sdk.value) {
      return
    }
    sdk.value.fileInstance().downloadFile(file.name).then((result: any) => {
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
      } else {
        window.open(file.url, '_blank')
      }
    })
  }
}

getFile(file.id);

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

      .orderby-thead {
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

    .title {
      margin-bottom: 15px;
      padding-left: 20px;
    }

    .document-card {
      width: 100%;
    }
  }
}

.file-name-loader {
  width: 100px;

  span {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    display: block;
    margin: 6px auto;
    position: relative;
    background: #FFF;
    box-sizing: border-box;
    animation: shadowExpandX 2s linear infinite alternate;
  }
}

@keyframes shadowExpandX {
  0% {
    box-shadow: 0 0, 0 0;
    color: rgba(255, 255, 255, 0.2);
  }
  100% {
    box-shadow: -24px 0, 24px 0;
    color: rgba(255, 255, 255, 0.8);
  }
}

</style>
