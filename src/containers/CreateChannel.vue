<template>
  <j-box p="800">
    <j-flex direction="column" gap="700">
      <div>
        <j-text variant="heading-sm">Create Channel</j-text>
        <j-text variant="body">
          Channels are ways to organize your conversations by topics.
        </j-text>
      </div>
      <j-flex direction="column" gap="400">
        <j-input
          autofocus
          size="lg"
          label="Name"
          :minlength="10"
          :maxlength="30"
          autovalidate
          required
          type="text"
          :value="channelName"
          @keydown.enter="createChannel"
          @input="(e) => (channelName = e.target.value)"
        ></j-input>
        <div>
          <j-button size="lg" @click="$emit('cancel')"> Cancel </j-button>
          <j-button
            size="lg"
            :loading="isCreatingChannel"
            :disabled="isCreatingChannel || !canSubmit"
            @click="createChannel"
            variant="primary"
          >
            Create Channel
          </j-button>
        </div>
      </j-flex>
    </j-flex>
  </j-box>
</template>

<script lang="ts">
import { useDataStore } from "@/store/data";
import { isValid } from "@/utils/validation";
import { defineComponent } from "vue";

export default defineComponent({
  emits: ["cancel", "submit"],
  setup() {
    const dataStore = useDataStore();

    return {
      dataStore,
    };
  },
  data() {
    return {
      channelName: "",
      isCreatingChannel: false,
    };
  },
  computed: {
    canSubmit(): boolean {
      return isValid(
        [
          {
            check: (val: string) => (val ? false : true),
            message: "This field is required",
          },
        ],
        this.channelName
      );
    },
  },
  methods: {
    async createChannel() {
      const communityId = this.$route.params.communityId as string;
      const name = this.channelName;
      this.isCreatingChannel = true;
      this.dataStore
        .createChannel({
          communityId,
          name,
        })
        .then((channel: any) => {
          this.$emit("submit");
          this.channelName = "";
          this.$router.push({
            name: "channel",
            params: {
              communityId: communityId,
              channelId: channel.name,
            },
          });
        })
        .finally(() => {
          this.isCreatingChannel = false;
        });
    },
  },
});
</script>
