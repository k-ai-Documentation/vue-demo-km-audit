<template lang="pug">
.collapse(ref="collapse", :class="{'collapse-open': toggle}" )
    .title(@click.stop="openCollapse()")
        img(src="kai-asset/expend_more.svg")
        slot(name="title")
    .body
        slot(v-if="toggle" name="body")
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const emit = defineEmits(['toggle'])

const props = defineProps({
    defaultOpen: {
        type: Boolean,
        default: true,
    },
})

const toggle = ref(props.defaultOpen)

function openCollapse() {
    toggle.value = !toggle.value
    emit('toggle', toggle.value)
}

</script>


<style lang="scss" scoped>
.collapse {
    width: 100%;
    .title {
        display: flex;
        align-items: center;
        margin-bottom: 20px;
        cursor: pointer;
        img {
            filter: var(--svg-filter-white-color);
            transition: all 0.3s;
        }
    }
    .body {
        transition: all 0.3s;
    }
    &.collapse-open {
        img {
            transform: rotate(180deg);
        }
    }
}

</style>