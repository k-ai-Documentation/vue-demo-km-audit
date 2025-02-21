<template lang="pug">
  .modal
    .close
      img(src="kai-asset/icons/close-small.svg" @click="$emit('closeModal')")
    .body
      slot(name="body")
</template>

<script setup lang="ts">

</script>

<style lang="scss" scoped>
  .modal {
    background: var(--white-color);
    border-radius: 4px;
    width: 900px;

    .close {
      text-align: right;
      padding-top: 24px;
      padding-left: 24px;
      padding-right: 24px;
      filter: var(--svg-filter-white-color);
      height: 50.5px;
      img {
        cursor: pointer;
      }
    }

    .body {
      padding: 10px 24px;
      max-height: 90%;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      line-height: 1.3;

      &:empty {
        padding: 0;
      }
    }
  }

</style>
