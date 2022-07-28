import {
  UpdateState,
  ToastState,
  ThemeState,
  CurrentThemeState,
} from "@/store/types";
import { useAppStore } from "..";

export default {
  setApplicationStartTime(payload: Date): void {
    const state = useAppStore();
    state.applicationStartTime = payload;
  },
  toggleSidebar(): void {
    const state = useAppStore();
    state.showSidebar = !state.showSidebar;
  },
  setSidebar(open: boolean): void {
    const state = useAppStore();
    state.showSidebar = open;
  },
  setSidebarWidth(width: number): void {
    const state = useAppStore();
    state.sidebarWidth = width;
  },
  setCurrentTheme(payload: CurrentThemeState): void {
    const state = useAppStore();
    state.currentTheme = payload;
  },
  setGlobalTheme(payload: ThemeState): void {
    const state = useAppStore();
    state.globalTheme = { ...state.globalTheme, ...payload };
  },
  setToast(payload: ToastState): void {
    const state = useAppStore();
    state.toast = { ...state.toast, ...payload };
  },
  showSuccessToast(payload: { message: string }): void {
    const state = useAppStore();
    state.toast = { variant: "success", open: true, ...payload };
  },
  showDangerToast(payload: { message: string }): void {
    const state = useAppStore();
    state.toast = { variant: "danger", open: true, ...payload };
  },
  setWindowState(payload: "minimize" | "visible" | "foreground"): void {
    const state = useAppStore();
    state.windowState = payload;
  },
  setUpdateState({ updateState }: { updateState: UpdateState }): void {
    const state = useAppStore();
    state.updateState = updateState;
  },
  setGlobalLoading(payload: boolean): void {
    const state = useAppStore();
    state.showGlobalLoading = payload;
  },
  setGlobalError(payload: { show: boolean; message: string }): void {
    const state = useAppStore();
    state.globalError = payload;
  },
  setShowCreateCommunity(payload: boolean): void {
    const state = useAppStore();
    state.modals.showCreateCommunity = payload;
  },
  setShowEditCommunity(payload: boolean): void {
    const state = useAppStore();
    state.modals.showEditCommunity = payload;
  },
  setShowCommunityMembers(payload: boolean): void {
    const state = useAppStore();
    state.modals.showCommunityMembers = payload;
  },
  setShowCreateChannel(payload: boolean): void {
    const state = useAppStore();
    state.modals.showCreateChannel = payload;
  },
  setShowEditProfile(payload: boolean): void {
    const state = useAppStore();
    state.modals.showEditProfile = payload;
  },
  setShowDisclaimer(payload: boolean): void {
    const state = useAppStore();
    state.modals.showDisclaimer = payload;
  },
  setShowSettings(payload: boolean): void {
    const state = useAppStore();
    state.modals.showSettings = payload;
  },
  setShowCommunitySettings(payload: boolean): void {
    const state = useAppStore();
    state.modals.showCommunitySettings = payload;
  },
  setShowInviteCode(payload: boolean): void {
    const state = useAppStore();
    state.modals.showInviteCode = payload;
  },
  setShowCode(payload: boolean): void {
    const state = useAppStore();
    state.modals.showCode = payload;
  },
};
