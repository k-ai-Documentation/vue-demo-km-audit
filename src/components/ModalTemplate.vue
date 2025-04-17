<template lang="pug">
  .modal
    .header-group
        .header
            slot(name="header")
        .close
            img(src="kai-asset/icons/close-small.svg" @click="$emit('closeModal')")
    .body
      slot(name="body")
</template>

<script setup lang="ts"></script>

<style lang="scss" scoped>
.modal {
    background: var(--white-color);
    border-radius: 4px;
    width: 900px;

    .header-group {
        display: flex;
        flex-direction: row;
        margin-top: 25px;
        justify-content: space-between;
        .close {
            text-align: right;
            padding-left: 24px;
            padding-right: 24px;
            filter: var(--svg-filter-white-color);
            img {
                cursor: pointer;
            }
        }

        .header {
            padding-left: 24px;
            padding-right: 24px;
            border-bottom: 1px solid var(--background-color);

            img {
                margin-left: auto;
            }
        }
    }

    .body {
        padding: 10px 24px;
        max-height: 85%;
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
