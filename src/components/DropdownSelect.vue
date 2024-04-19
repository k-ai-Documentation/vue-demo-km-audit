<template lang="pug">
  .dropdown-select(@click.stop="" ref="dropdown" :class="{'open' : toggle}" @mouseleave="toggle = false")
    .trigger(@click="toggle = !toggle")
      slot(name="trigger")
      img(src="kai-asset/expend_more.svg")
    .body(v-if="toggle" @click.stop="toggle = false")
      slot(name="body")
</template>

<script lang="ts" setup>
import {ref, type Ref} from 'vue';
const toggle: Ref<boolean> = ref(false)

</script>

<style lang="scss" scoped>

.dropdown-select {
  position: relative;
  z-index: 2000;

  .trigger {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: fit-content;
    height: fit-content;
    cursor: pointer;
    background: transparent;
    border-top: 1px solid transparent;
    border-right: 1px solid transparent;
    border-left: 1px solid transparent;
    padding-right: 14px;

    img {
      filter: var(--svg-filter-white-color);
    }
  }

  .body {
    position: absolute;
    cursor: pointer;
    background: var(--dark-grey-color);
    border-bottom: 1px solid var(--black-color);
    border-right: 1px solid var(--black-color);
    border-left: 1px solid var(--black-color);
  }

  &.open {
    .trigger {
      background: var(--dark-grey-color);
      border-radius: 4px 4px 0 0;
      border-top: 1px solid var(--color-border);
      border-right: 1px solid var(--color-border);
      border-left: 1px solid var(--color-border);
    }

    .body {
      border-radius: 0 0 4px 4px;
      border-right: 1px solid var(--color-border);
      border-left: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }

    img {
      transform: rotate(180deg);
    }
  }
}

</style>
