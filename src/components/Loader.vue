<template lang="pug">
  span.loader(:class="{'white':color}")
</template>

<script setup lang="ts">
  const props = defineProps(["color"])
</script>

<style scoped lang="scss">
  .loader {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    position: relative;
    animation: rotate 1s linear infinite
  }
  .loader::before {
    content: "";
    box-sizing: border-box;
    position: absolute;
    inset: 0;
    border-radius: 50%;
    border: 2px solid var(--black-color);
    animation: prixClipFix 2s linear infinite ;
  }

  .white::before {
    border: 2px solid var(--white-color) !important;
  }

  @keyframes rotate {
    100%   {transform: rotate(360deg)}
  }

  @keyframes prixClipFix {
    0%   {clip-path:polygon(50% 50%,0 0,0 0,0 0,0 0,0 0)}
    25%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 0,100% 0,100% 0)}
    50%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,100% 100%,100% 100%)}
    75%  {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 100%)}
    100% {clip-path:polygon(50% 50%,0 0,100% 0,100% 100%,0 100%,0 0)}
  }
</style>
