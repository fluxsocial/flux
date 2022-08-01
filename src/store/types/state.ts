import { UserState } from "./userprofile";
import { LocalCommunityState } from "./community";
import { ChannelState } from "./channel";
import { NeighbourhoodState } from "./neighbourhood";
import {
  WindowState,
  ModalsState,
  CurrentThemeState,
  ToastState,
  ThemeState,
  UpdateState,
} from "./ui";

export interface State {
  app: ApplicationState;
  data: DataState;
  user: UserState;
}

export interface DataState {
  communities: { [perspectiveUuid: string]: LocalCommunityState };
  channels: { [perspectiveUuid: string]: ChannelState };
  neighbourhoods: { [perspectiveUuid: string]: NeighbourhoodState };
}

export interface ApplicationState {
  windowState: WindowState;
  toast: ToastState;
  applicationStartTime: Date;
  updateState: UpdateState;
  globalTheme: ThemeState;
  currentTheme: CurrentThemeState;
  modals: ModalsState;
  showSidebar: boolean;
  sidebarWidth: number;
  showGlobalLoading: boolean;
  globalError: {
    show: boolean;
    message: string;
  };
}
