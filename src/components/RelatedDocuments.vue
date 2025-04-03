<template lang="pug">
.related-documents
    .tabs
        p.text-regular-14(:class="{ active: menu == 'overview' }" @click="menu = 'overview'") Overview by subjects
        p.text-regular-14(:class="{ active: menu == 'oneByOne' }"  @click="menu = 'oneByOne'") {{type.charAt(0).toUpperCase() + type.slice(1)}} one by one
        p.text-regular-14(:class="{ active: menu == 'grouped' }" @click="menu = 'grouped'") {{type.charAt(0).toUpperCase() + type.slice(1)}} grouped by document
    .overview(v-if="menu == 'overview'")
        AnomalieOverview(:type="props.type")
    .one-by-one(v-if="menu == 'oneByOne'")
        .top
            DropdownSelect.filter(v-if="typeList && (conflictInformationList.length || duplicatedInformationList.length)")
                template(#trigger)
                    div.selected-type
                        p.text-regular-14.text-white {{ selectedType }}
                template(#body)
                    .document-type
                        p.text-white.text-medium-14(v-for="type in otherTypes" @click="selectedType = type") {{ type }}
        document-card.document-card(v-for="(element, index) in documentsToShow" :document="element" :key="element.subject + '_' + element.status" :type="props.type" :credentials="credentials")
    .grouped(v-if="menu == 'grouped'")
        anomalie-grouped-by-doc(:type="props.type")
</template>

<script setup lang="ts">
import { computed, type ComputedRef, onMounted, ref, type Ref, watch } from 'vue';
import DropdownSelect from './DropdownSelect.vue';
import DocumentCard from './DocumentCard.vue';
import AnomalieOverview from './AnomalieOverview.vue';
import AnomalieGroupedByDoc from './AnomalieGroupedByDoc.vue';
import { useAnomalyStore } from './../store/anomaly';
import {storeToRefs} from 'pinia';

const anomalyStore = useAnomalyStore();
const { conflictInformationList, duplicatedInformationList } = storeToRefs(anomalyStore);

interface Anomaly {
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

const typeList: Ref<string[]> = ref(['All', 'Managed', 'Detected', 'Ignored']);

const selectedType: Ref<string> = ref('All');

const menu: Ref<string> = ref('overview');

const otherTypes: ComputedRef<string[]> = computed(() => {
    return typeList.value.filter((t: string) => t != selectedType.value);
});

const documentsToShow = computed(() => {
    if (selectedType.value == 'All') {
        return props.type == 'conflict' ? conflictInformationList.value : duplicatedInformationList.value ;
    }
    const documents = props.type == 'conflict' ? conflictInformationList.value : duplicatedInformationList.value ;
    return documents.filter((document: any) => {
        return document.state == selectedType.value.toUpperCase();
    });
});
</script>

<style scoped lang="scss">
.related-documents {
    .tabs {
        display: flex;
        flex-direction: row;
        margin: 50px 0;

        p {
            cursor: pointer;
            margin-right: 40px;
            border-bottom: 2px solid transparent;
            display: flex;
            flex-direction: row;
            align-items: center;
            color: var(--grey-color);
            padding-bottom: 5px;

            &.active {
                border-bottom: 2px solid var(--primary-color);
                color: var(--white-color);

                img {
                    filter: var(--svg-filter-white-color);
                }
            }
        }
    }
    .top {
        display: flex;
        justify-content: flex-end;
        width: calc(100% - 200px);
        height: 32px;
        align-items: center;
        margin-bottom: 20px;
    }

    .filter {
        z-index: 3000;

        .selected-type {
            width: 140px;
            padding: 14px 0 14px 14px;

            img {
                filter: var(--svg-filter-white-color);
            }
        }

        .document-type {
            width: 164px;
            padding: 0 14px 14px;

            p {
                margin-bottom: 14px;

                &:first-letter {
                    text-transform: capitalize;
                }

                &:last-child {
                    margin-bottom: 0;
                }

                &:hover {
                    color: var(--primary-color);
                }
            }
        }
    }
}
</style>
