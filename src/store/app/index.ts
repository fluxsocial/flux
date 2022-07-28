import mutations from "./mutations";
import actions from "./actions";
import getters from "./getters";
import { ApplicationState } from "../types";
import { defineStore } from "pinia";

export const useAppStore = defineStore("app", {
  state(): ApplicationState {
    return {
      updateState: "not-available",
      windowState: "visible",
      applicationStartTime: new Date(),
      modals: {
        showCreateCommunity: false,
        showEditCommunity: false,
        showCommunityMembers: false,
        showCreateChannel: false,
        showEditProfile: false,
        showSettings: false,
        showCommunitySettings: false,
        showInviteCode: false,
        showDisclaimer: true,
        showCode: false,
      },
      showSidebar: true,
      sidebarWidth: 330,
      showGlobalLoading: false,
      globalTheme: {
        fontSize: "md",
        fontFamily: "Poppins",
        name: "dark",
        hue: 270,
        saturation: 60,
      },
      currentTheme: "global",
      toast: {
        variant: "",
        message: "",
        open: false,
      },
      globalError: {
        show: false,
        message: "",
      },
    };
  },
  getters,
  actions: {
    ...mutations,
    ...actions,
  },
});
