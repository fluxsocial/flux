<template>
  <div class="img-upload" id="fileInputButton" @click="onFileClick">
    <j-flex direction="column" gap="400" a="center">
      <div class="img-upload__avatar">
        <img :src="value" v-if="value" />
        <j-button variant="link" v-if="!value" size="sm">Upload image</j-button>
        <j-button class="remove" v-if="value" @click="removeImage" size="sm">
          Remove image
        </j-button>
      </div>
    </j-flex>
  </div>
  <input
    :disabled="disabled"
    id="bannerFileInput"
    ref="fileInput"
    accept="image/*"
    style="display: none"
    type="file"
    @change.prevent="selectFile"
  />
  <teleport to="#popup-target">
    <j-modal :open="tempProfileImage !== null">
      <j-box>
        <div class="cropper">
          <cropper
            ref="cropper"
            class="cropper__element"
            backgroundClass="cropper__background"
            :src="tempProfileImage"
            :stencil-props="{
              aspectRatio: 12 / 4,
            }"
          ></cropper>
          <j-box pt="300">
            <j-button @click="clearImage">Cancel</j-button>
            <j-button variant="primary" @click="selectImage">Ok</j-button>
          </j-box>
        </div>
      </j-box>
    </j-modal>
  </teleport>
</template>

<script lang="ts">
import "vue-advanced-cropper/dist/style.css";
import { defineComponent } from "vue";
import { Cropper } from "vue-advanced-cropper";

export default defineComponent({
  components: { Cropper },
  emits: ["change", "hide"],
  props: {
    value: String,
    disabled: Boolean,
    hash: String,
    icon: {
      default: "person-fill",
      type: String,
    },
  },
  data() {
    return {
      tempProfileImage: null,
    };
  },
  methods: {
    onFileClick() {
      document.getElementById("bannerFileInput")?.click();
    },
    selectFile(e: any) {
      const files = e.target.files || e.dataTransfer.files;
      if (!files.length) return;

      var reader = new FileReader();

      reader.onload = (e) => {
        const temp: any = e.target?.result;
        this.tempProfileImage = temp;
      };

      reader.readAsDataURL(files[0]);
    },
    removeImage(e: any) {
      e.preventDefault();
      e.stopPropagation();
      // @ts-ignore
      this.$refs.fileInput.value = "";
      this.$emit("change", null);
    },
    clearImage() {
      // @ts-ignore
      this.$refs.fileInput.value = "";
      this.tempProfileImage = null;
    },
    selectImage() {
      const result = (this.$refs.cropper as any).getResult();
      const data = result.canvas.toDataURL();
      this.tempProfileImage = null;
      this.$emit("change", data);
    },
  },
  watch: {
    tempProfileImage() {
      this.$emit("hide", this.tempProfileImage !== null);
    },
  },
});
</script>

<style lang="scss" scoped>
.img-upload {
  background-color: var(--junto-border-color);
  background-size: cover;
  width: 100%;
  height: 200px;
}
.img-upload j-avatar {
  --j-avatar-size: 7rem;
}

.img-upload__avatar {
  display: grid;
  place-items: center;
  background: var(--j-color-ui-200);
  text-align: center;
  cursor: pointer;
  width: 100%;
  height: 200px;
  position: relative;
}

.remove {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.img-upload__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.img-upload__icon {
  color: var(--j-color-white);
}

.cropper {
  background: var(--j-color-white);
  padding: var(--j-space-500);
  box-shadow: var(--j-depth-300);
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  min-height: 600px;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  z-index: 999;
}

.cropper__element {
  flex-grow: 1;
  max-height: 80vh;

  &__background {
    background: transparent !important;
  }
}
</style>
