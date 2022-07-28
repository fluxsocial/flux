import { createPinia, Pinia, setActivePinia } from "pinia";
import { useAppStore } from "@/store/app";

describe("App Mutations", () => {
  let store: Pinia;
  let date: Date;

  beforeEach(() => {
    date = new Date();

    store = createPinia();

    setActivePinia(store);
  });

  test("setApplicationStartTime", () => {
    const appStore = useAppStore();

    const currentDate = new Date();

    appStore.setApplicationStartTime(currentDate);

    expect(appStore.applicationStartTime).toStrictEqual(currentDate);
  });

  test("toggleSidebar", () => {
    const appStore = useAppStore();

    expect(appStore.showSidebar).toBeTruthy();

    appStore.toggleSidebar();

    expect(appStore.showSidebar).toBeFalsy();
  });

  test("setSidebar", () => {
    const appStore = useAppStore();

    expect(appStore.showSidebar).toBeTruthy();

    appStore.setSidebar(false);

    expect(appStore.showSidebar).toBeFalsy();
  });

  test("setCurrentTheme", () => {
    const appStore = useAppStore();

    expect(appStore.currentTheme).toBe("global");

    appStore.setCurrentTheme("bebd2ac2-1e80-44d2-b807-0163c2bcef40");

    expect(appStore.currentTheme).toBe("bebd2ac2-1e80-44d2-b807-0163c2bcef40");
  });

  test("setGlobalTheme", () => {
    const appStore = useAppStore();

    expect(appStore.globalTheme).toStrictEqual({
      fontFamily: "Poppins",
      fontSize: "md",
      hue: 270,
      name: "dark",
      saturation: 60,
    });

    // @ts-ignore
    appStore.setGlobalTheme({ fontFamily: "Arial", hue: 70 });

    expect(appStore.globalTheme).toStrictEqual({
      fontFamily: "Arial",
      fontSize: "md",
      hue: 70,
      name: "dark",
      saturation: 60,
    });
  });

  test("setToast", () => {
    const appStore = useAppStore();

    expect(appStore.toast).toStrictEqual({
      variant: "",
      open: false,
      message: "",
    });

    appStore.setToast({ message: "error", open: true, variant: "error" });

    expect(appStore.toast).toStrictEqual({
      variant: "error",
      open: true,
      message: "error",
    });
  });

  test("showSuccessToast", () => {
    const appStore = useAppStore();

    expect(appStore.toast).toStrictEqual({
      variant: "",
      open: false,
      message: "",
    });

    appStore.showSuccessToast({ message: "success" });

    expect(appStore.toast).toStrictEqual({
      variant: "success",
      open: true,
      message: "success",
    });
  });

  test("showDangerToast", () => {
    const appStore = useAppStore();

    expect(appStore.toast).toStrictEqual({
      variant: "",
      open: false,
      message: "",
    });

    appStore.showDangerToast({ message: "error" });

    expect(appStore.toast).toStrictEqual({
      variant: "danger",
      open: true,
      message: "error",
    });
  });

  test("setWindowState", () => {
    const appStore = useAppStore();

    expect(appStore.windowState).toBe("visible");

    appStore.setWindowState("foreground");

    expect(appStore.windowState).toBe("foreground");
  });

  test("setUpdateState", () => {
    const appStore = useAppStore();

    expect(appStore.updateState).toBe("not-available");

    appStore.setUpdateState({ updateState: "available" });

    expect(appStore.updateState).toBe("available");
  });

  test("setGlobalLoading", () => {
    const appStore = useAppStore();

    expect(appStore.showGlobalLoading).toBeFalsy();

    appStore.setGlobalLoading(true);

    expect(appStore.showGlobalLoading).toBeTruthy();
  });

  test("setGlobalError", () => {
    const appStore = useAppStore();

    expect(appStore.globalError.show).toBeFalsy();
    expect(appStore.globalError.message).toBe("");

    appStore.setGlobalError({
      show: true,
      message: "error",
    });

    expect(appStore.globalError.show).toBeTruthy();
    expect(appStore.globalError.message).toBe("error");
  });

  test("setShowCreateCommunity", () => {
    const appStore = useAppStore();

    expect(appStore.modals.showCreateCommunity).toBeFalsy();

    appStore.setShowCreateCommunity(true);

    expect(appStore.modals.showCreateCommunity).toBeTruthy();
  });

  test("setShowEditCommunity", () => {
    const appStore = useAppStore();

    expect(appStore.modals.showEditCommunity).toBeFalsy();

    appStore.setShowEditCommunity(true);

    expect(appStore.modals.showEditCommunity).toBeTruthy();
  });

  test("setShowCommunityMembers", () => {
    const appStore = useAppStore();

    expect(appStore.modals.showCommunityMembers).toBeFalsy();

    appStore.setShowCommunityMembers(true);

    expect(appStore.modals.showCommunityMembers).toBeTruthy();
  });

  test("setShowCreateChannel", () => {
    const appStore = useAppStore();

    expect(appStore.modals.showCreateChannel).toBeFalsy();

    appStore.setShowCreateChannel(true);

    expect(appStore.modals.showCreateChannel).toBeTruthy();
  });

  test("setShowEditProfile", () => {
    const appStore = useAppStore();

    expect(appStore.modals.showEditProfile).toBeFalsy();

    appStore.setShowEditProfile(true);

    expect(appStore.modals.showEditProfile).toBeTruthy();
  });

  test("setShowDisclaimer", () => {
    const appStore = useAppStore();

    expect(appStore.modals.showDisclaimer).toBeTruthy();

    appStore.setShowDisclaimer(false);

    expect(appStore.modals.showDisclaimer).toBeFalsy();
  });

  test("setShowSettings", () => {
    const appStore = useAppStore();

    expect(appStore.modals.showSettings).toBeFalsy();

    appStore.setShowSettings(true);

    expect(appStore.modals.showSettings).toBeTruthy();
  });

  test("setShowCommunitySettings", () => {
    const appStore = useAppStore();

    expect(appStore.modals.showCommunitySettings).toBeFalsy();

    appStore.setShowCommunitySettings(true);

    expect(appStore.modals.showCommunitySettings).toBeTruthy();
  });

  test("setShowInviteCode", () => {
    const appStore = useAppStore();

    expect(appStore.modals.showInviteCode).toBeFalsy();

    appStore.setShowInviteCode(true);

    expect(appStore.modals.showInviteCode).toBeTruthy();
  });
});
