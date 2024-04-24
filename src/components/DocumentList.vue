<template lang="pug">
  .document-list(v-if="documentList.length")
    table.files
      thead
        tr
          th.text-medium-14.text-grey Name
      tbody
        tr(v-for="(file, index) in documentList" :key="file.name" @click="goTo(file)")
          td.name-td(width=576)
            p.text-white.text-regular-14 {{ file.name }}
</template>

<script setup lang="ts">
import Buffer from "vue-buffer"
import axios from 'axios'

const pros = defineProps(['documentList', 'credentials'])
const documentList = pros.documentList
const credentials = pros.credentials


async function goTo(file: any) {

  if (file.url.indexOf("/api/orchestrator/files/download") != -1) {

    let hostUrl = import.meta.env.VITE_HOST_URL
    let baseUrl = ""
    let headers = {}

    if (hostUrl) {
      baseUrl = import.meta.env.VITE_HOST_URL
      headers = {
        'Content-Type': 'application/json',
      }

    } else if (credentials && credentials.organizationId && credentials.instanceId) {
      baseUrl = `https://${credentials.organizationId}.kai-studio.ai/${credentials.instanceId}`
      headers = {
        'organization-id': credentials.organizationId,
        'instance-id': credentials.instanceId,
        'api-key': credentials.apiKey
      }
    }

    if (!baseUrl) {
      return
    }

    const result = await axios({
      url: `${baseUrl}` + file.url,
      method: 'GET',
      headers: headers
    })

    if (result && result.data) {
      const buffer = Buffer.from(result.data.response);
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
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid var(--color-border);

      td {
        height: 50px;
        line-height: 50px;
        vertical-align: middle
      }
    }
  }

  .name-td {
    cursor: pointer;

    &:hover {
      p {
        color: var(--primary-color)
      }
    }
  }
}
</style>
