<template lang="pug">
  .app
    .header.text-regular-32.text-white KM Audit Demo
    KMAuditPage
</template>

<script setup lang="ts">
import KMAuditPage from "@/views/KMAuditPage.vue";
</script>

<style scoped lang="scss">
.app {
  padding: 40px;
  height: 100vh;
  overflow: scroll;
}
</style>
