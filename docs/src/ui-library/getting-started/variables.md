<script setup>
 import {ref, onMounted} from 'vue'
import variables from './variables'
</script>

<style scoped>

.grid {
 display: grid;
 margin-bottom: var(--j-space-500);
 grid-template-columns: 1fr 3fr;
}

.flex {
 display: flex;
 flex-direction: row;
 gap: var(--j-space-200);
}

.color {
 border-radius: var(--j-border-radius);
 width: var(--j-size-md);
 height: var(--j-size-md);
}

.spacing {
 display: inline-block;
  background-color: var(--j-color-primary-500);
}

.font {
  display: inline-block;
  font-weight: 700;
}

</style>

# Variables

Flux UI comes with a lot of CSS variables you can change to make your own theme, but also use when composing your own UI components.

## Colors

<div class="grid" v-for="token in variables.Colors">
  <div>
    <j-text size="500" nomargin color="black" weight="500">{{token.name}}</j-text>
    <j-text v-if="token.values" variant="body">--j-color-{{token.prefix}}-{n}</j-text>
    <j-text v-else variant="body">--j-color-{{token.prefix}}</j-text>
  </div>
  <div class="flex">
    <div v-if="token.values" v-for="value in token.values">
        <div class="color" :style="`background-color: var(--j-color-${token.prefix}-${value})`" ></div>
         <j-text nomargin size="300" color="ui-500">{{value}}</j-text>
    </div>
    <div v-else class="color" :style="`background-color: var(--j-color-${token.prefix})`"></div>
  </div>
</div>

## Spacing

<div class="grid" v-for="token in variables.Spacing">
  <div>
    <j-text size="500" nomargin color="black" weight="500">{{token.name}}</j-text>
    <j-text variant="body">--j-space-{{token.prefix}}-{n}</j-text>
  </div>
  <div class="flex">
    <div v-for="value in token.values">
        <div class="spacing" :style="`padding: var(--j-space-${value})`"></div>
         <j-text nomargin size="300" color="ui-500">{{value}}</j-text>
    </div>
  </div>
</div>

## Typography

<div class="grid" v-for="token in variables.Typography">
  <div>
    <j-text size="500" nomargin color="black" weight="500">{{token.name}}</j-text>
    <j-text variant="body">--j-{{token.prefix}}-{n}</j-text>
  </div>
  <div class="flex">
    <div v-for="value in token.values">
        <div class="font" :style="`font-size: var(--j-font-size-${value})`">Ab</div>
        <j-text nomargin size="300" color="ui-500">{{value}}</j-text>
    </div>
  </div>
</div>
