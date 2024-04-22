<template lang="pug">
  .missing-subject
    .top
      p.text-white.text-bold-14 Subject: {{subject.subject}}
    p.information
      p.text-bold-14.text-grey.involved-information Needed information:
      p.text-regular-14.text-white {{subject.information_needed}}
    .questions
      p.text-bold-14.text-grey.questions Questions:
      p.text-regular-14.text-white(v-for="question in subject.questions") · {{question}}
</template>

<script setup lang="ts">
const pros = defineProps(['subject'])
const subject = pros.subject
</script>

<style scoped lang="scss">
.missing-subject {
  border-radius: 10px;
  border: 2px solid var(--color-border);
  margin-bottom: 20px;
  width: 800px;
  padding: 20px;

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 15px;
  }

  .information {
    margin-bottom: 15px;

    &:last-child {
      margin-bottom: 0;
    }

    .name, .involved-information, .question {
      margin-bottom: 5px;
    }
  }
}
</style>
