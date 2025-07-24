<template lang="pug">
  .document-card
    .top
      p.text-white.text-bold-14 Subject: {{file.subject}}
      .toggle-block
        p.text-white.text-medium-14(v-if="file.state == 'DISAPPEARED'") {{file.state}}
        DropdownSelect(v-else)
            template(#trigger)
                .trigger
                    p.text-white.text-medium-14 {{file.state}}
            template(#body)
                .select-box(v-for="state in availableStateList" :key="state")
                    p.text-white.text-medium-14( @click="setStatus(state)") {{state}}

    .information(v-for="(element, index) in informationMerge" :key="index")
      p.text-bold-14.text-white.name(@click="goTo(element)") DOC {{index+1}}: {{element.name}}
      p.text-regular-14.text-white.detail {{element.information_involved}}
    .explanation(v-if="file.explanation")
      p.text-white.text-bold-14 Explanation:
      p.text-white.text-regular-14 {{file.explanation}}
    .open-all
      .action(@click="downloadAll()")
        p.text-regular-14.text-white Open all these documents
        img.icon-18(src="kai-asset/share.svg" alt="Open all these documents")


</template>

<script setup lang="ts">
import { computed, type ComputedRef, onMounted, ref, type Ref } from 'vue';
import { KaiStudioInstance } from 'sdk-js';
import Buffer from 'vue-buffer';
import axios from 'axios';
import DropdownSelect from './DropdownSelect.vue';
import { useAnomalyStore } from './../store/anomaly';
import { storeToRefs } from 'pinia';

const props = defineProps(['document', 'type']);
const file = props.document;
const type = props.type;
const informationMerge = ref<any[]>([]);

const anomalyStore = useAnomalyStore();
const { sdk } = storeToRefs(anomalyStore);

const stateList: Ref<string[]> = ref(['DETECTED', 'MANAGED', 'IGNORED', 'DISAPPEARED', 'REDETECTED']);

const availableStateList = computed(() => {
    if (file.state == 'MANAGED' ) {
        return ['DETECTED', 'IGNORED'];
    }
    if (file.state == 'DETECTED' ) {
        return ['MANAGED', 'IGNORED'];
    }
    if (file.state == 'IGNORED' ) {
        return ['DETECTED', 'MANAGED'];
    }
    if (file.state == 'REDETECTED' ) {
        return ['MANAGED', 'IGNORED'];
    }
});

async function fetchMergeInformation() {
    const documents = file.documents;
    let toReturn: any = [];
    if (documents) {
        const documentInstance = sdk.value.document();
        for (const doc of documents) {
            const docInfo = await documentInstance.getDocumentDetail(doc.doc_id);
            let matchedResult = {
                name: docInfo.name,
                url: docInfo.url,
                id: docInfo.id,
                information_involved: doc.information_involved,
            };
            toReturn.push(matchedResult);
        }
    }
    informationMerge.value = toReturn;
}

function setStatus(state: string) {
    switch (type) {
        case 'conflict':
            anomalyStore.setConflictState(file.id, state.toLowerCase());
            break;
        case 'duplicated':
            anomalyStore.setDuplicateState(file.id, state.toLowerCase());
            break;
    }
}

async function goTo(file: any) {
    if (file.id.indexOf('ABS') != -1) {
        if (!sdk.value) {
            return;
        }
        const result = await sdk.value.document().downloadFile(file.id);
        if (result) {
            const buffer = Buffer.from(result);
            const blob = new Blob([buffer]);
            const url = window.URL.createObjectURL(blob);
            let a = document.createElement('a');
            document.body.appendChild(a);
            a.setAttribute('style', 'display: none');
            a.href = url;
            a.download = file.name;
            a.click();
            window.URL.revokeObjectURL(url);
        }
    } else {
        window.open(file.url, '_blank');
    }
}

async function downloadAll() {
    for (const el of informationMerge.value) {
        try {
            await goTo(el);
        } catch (error) {
            console.error('Error downloading file:', el.name, error);
        }
    }
}

onMounted( () => {
    fetchMergeInformation();
});
</script>

<style scoped lang="scss">
.document-card {
    border-radius: 10px;
    border: 2px solid var(--color-border);
    margin-bottom: 20px;
    width: calc(100% - 200px);
    padding: 20px;
    background: var(--dark-grey-color);

    .top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 30px;
    }

    .toggle-block {
        .trigger {
            padding: 7px 14px 0px;
            width: 140px;
        }
        .select-box {
            width: 164px;
            padding-left: 14px;
            margin-bottom: 7px;
            p {
                &:hover {
                    color: var(--primary-color);
                }
            }
            &:first-child {
                margin-top: 7px;
            }
        }
    }
    .explanation {
        margin-bottom: 10px;
    }

    .information {
        margin-bottom: 23px;

        .involved-information {
            margin-bottom: 5px;
        }

        .name {
            cursor: pointer;

            &:hover {
                color: var(--primary-color);
            }
        }

        &:last-child {
            margin-bottom: 0;
        }
    }

    .state {
        margin-left: 5px;
    }

    .bottom {
        display: flex;
        justify-content: flex-end;
    }

    .detail {
        line-height: 1.3;
        white-space: pre-wrap;
    }

    .open-all {
        display: flex;
        justify-content: flex-end;
        align-items: center;

        .action {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            cursor: pointer;

            p {
                margin-right: 10px;
            }
        }
    }
}
</style>
