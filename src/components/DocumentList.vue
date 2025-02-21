<template lang="pug">
  .document-list(v-if="documentList.length")
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
        tr(v-for="(file, index) in documentList" :key="file.name")
          td.name-td(width=576)
            p.text-white.text-regular-14(@click="goTo(file)") {{ file.name }}
          td.conflict(width=300)
            p.text-white.text-regular-14 {{ file.count_conflicts }}
          td.duplicate(width=300)
            p.text-white.text-regular-14 {{ file.count_duplicates }}
</template>

<script setup lang="ts">
import Buffer from "vue-buffer"
import axios from 'axios'
import dropdown from 'kai-asset/icons/dropdown.svg'
import { onMounted, ref } from "vue"

const pros = defineProps(['documentList', 'credentials'])
const documentList = pros.documentList
const credentials = pros.credentials

const orderType = ref('count_conflicts')
const orderDirection = ref('asc')

function orderby(type: string) {
    if (orderType.value != type) {
        orderDirection.value = 'desc'
    }else {
        orderDirection.value = orderDirection.value == 'asc' ? 'desc' : 'asc'
    }
    orderType.value = type
    documentList.sort((a: any, b: any) => {
        if (orderDirection.value == 'asc') {
            return a[type] - b[type]
        } else {
            return b[type] - a[type]
        }
    })
}

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
      baseUrl = `https://api.kai-studio.ai`
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
      method: 'POST',
      headers: headers,
      data: {
        id: file.id
      }
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
        height: 50px;
        line-height: 50px;
        &.name-td {
          p {
            cursor: pointer;
            &:hover {
                color: var(--primary-color);
            }
          }
          
        }
      }
    }
  }
}
</style>
