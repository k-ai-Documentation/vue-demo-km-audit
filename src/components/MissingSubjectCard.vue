<template lang="pug">
  .missing-subject
    .top
      p.text-white.text-bold-14 Subject: {{subject.subject}}
    .information
      p.text-bold-14.text-grey.needed-information Needed information:
      p.text-regular-14.text-white {{subject.information_needed}}
    .questions
      p.text-bold-14.text-grey.question Related questions:
      p.text-regular-14.text-white.question(v-for="question in subject.questions") - {{question}}
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
  width: calc(100% - 200px);
  padding: 20px;
  background: var(--dark-grey-color);

  .top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 30px;
  }

  .information {
    margin-bottom: 23px;

    &:last-child {
      margin-bottom: 0;
    }

    .needed-information {
      margin-bottom: 5px;
    }
  }

  .questions {
    .question {
      margin-bottom: 3px;
    }
  }
}
</style>
