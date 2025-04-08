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
            .input-container
                input.simple-input-h30.search-anomalies(type="text" :placeholder="`Search anything in ${props.type}...`" @keyup.enter="searchAnomalies" v-model="subjectToSearch")
                button.btn-outline-rounded-30(@click="searchAnomalies") Search
            DropdownSelect.filter(v-if="typeList && (conflictInformationList.length || duplicatedInformationList.length || conflictInformationWithSearch.length || duplicatedInformationWithSearch.length)")
                template(#trigger)
                    div.selected-type
                        p.text-regular-14.text-white {{ selectedType }}
                template(#body)
                    .document-type
                        p.text-white.text-medium-14(v-for="type in otherTypes" @click="selectedType = type") {{ type }}
        document-card.document-card(v-if="documentsToShow.length > 0" v-for="(element, index) in documentsToShow" :document="element" :key="element.subject + '_' + index" :type="props.type")
    .grouped(v-if="menu == 'grouped'")
        anomalie-grouped-by-doc(:type="props.type")
</template>

<script setup lang="ts">
import { computed, type ComputedRef, ref, type Ref, watch } from 'vue';
import DropdownSelect from './DropdownSelect.vue';
import DocumentCard from './DocumentCard.vue';
import AnomalieOverview from './AnomalieOverview.vue';
import AnomalieGroupedByDoc from './AnomalieGroupedByDoc.vue';
import { useAnomalyStore } from './../store/anomaly';
import { storeToRefs } from 'pinia';

const anomalyStore = useAnomalyStore();
const { conflictInformationList, duplicatedInformationList, conflictInformationWithSearch, duplicatedInformationWithSearch } = storeToRefs(anomalyStore);

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

const subjectToSearch: Ref<string> = ref('');
const searchApplied: Ref<boolean> = ref(false);

const otherTypes: ComputedRef<string[]> = computed(() => {
    return typeList.value.filter((t: string) => t != selectedType.value);
});
const documentsToShow = computed(() => {
    const documents =
        props.type === 'conflict'
            ? searchApplied.value
                ? [...conflictInformationWithSearch.value]
                : [...conflictInformationList.value]
            : searchApplied.value
                ? [...duplicatedInformationWithSearch.value]
                : [...duplicatedInformationList.value];

    if (selectedType.value === 'All') {
        return documents;
    }

    return documents.filter((document: any) => document.state === selectedType.value.toUpperCase());
});

function searchAnomalies() {
    if (subjectToSearch.value.trim() !== '') {
        searchApplied.value = true;  
        if (props.type == 'conflict') {
            anomalyStore.getConflictInformation(subjectToSearch.value);
        } else {
            anomalyStore.getDuplicatedInformation(subjectToSearch.value);
        }
    }
}

watch(
    () => subjectToSearch.value,
    (newVal, oldVal) => {
        if (newVal == '') {
            searchApplied.value = false;  
            if (props.type == 'conflict') {
                anomalyStore.resetConflictSearch();
            } else {
                anomalyStore.resetDuplicatedSearch();
            }
        }
    }
);
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
        justify-content: space-between;
        width: calc(100% - 200px);
        height: 32px;
        align-items: center;
        margin-bottom: 20px;
        .search-anomalies {
            border-bottom: 1px solid var(--grey-color);
        }
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
