import vue from "@vitejs/plugin-vue";
import path from "path";

export default {
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => {
            return tag.startsWith("j-") || tag === "perspective-view";
          },
        },
      },
    }),
  ],
  define: {
    "process.env": {},
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
};