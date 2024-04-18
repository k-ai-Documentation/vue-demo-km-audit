<template lang="pug">
  .document-list(:key="documentList && documentList.length")
    table.files
      thead
        tr
          th.text-medium-14.text-grey Index
          th.text-medium-14.text-grey Name
      tbody
        tr(v-for="(file, index) in documentList" :key="file.name")
          td.index(width=30)
            p.text-white.text-regular-14 {{ index + 1 }}
          td.name-td(width=576)
            p.text-white.text-regular-14 {{ file.name }}
</template>

<script setup lang="ts">
const pros = defineProps(['documentList'])
const documentList = pros.documentList

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
}
</style>
