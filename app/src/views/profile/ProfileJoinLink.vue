<template>
  <j-box pt="1000" pb="800" px="700">
    <j-text variant="heading-sm">Join Community</j-text>
    <j-text variant="body"
      >You are not part of this community, would you like to join this
      community?</j-text
    >
    <j-button
      :disabled="isJoiningCommunity || !joiningLink"
      :loading="isJoiningCommunity"
      @click="joinCommunity"
      size="lg"
      full
      variant="primary"
    >
      Join Community
    </j-button>
  </j-box>
</template>

<script lang="ts">
import { defineComponent, ref } from "vue";
import { joinCommunity } from "@coasys/flux-api";

export default defineComponent({
  props: ["joiningLink"],
  emits: ["cancel", "submit"],
  setup() {
    return {
      isJoiningCommunity: ref(false),
    };
  },
  methods: {
    joinCommunity() {
      this.isJoiningCommunity = true;

      joinCommunity({ joiningLink: this.joiningLink })
        .then(() => {
          this.$emit("submit");
        })
        .finally(() => {
          this.isJoiningCommunity = false;
        });
    },
  },
});
</script>

<style scoped>
.container {
  width: 100%;
  height: 300px;
  margin: 0;
  padding: 20px;
}
</style>
