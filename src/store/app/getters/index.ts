import { ApplicationState, WindowState } from "@/store/types";

export default {
  getApplicationStartTime(state: ApplicationState): Date {
    return state.applicationStartTime;
  },

  getWindowState(state: ApplicationState): WindowState {
    return state.windowState;
  },
};
