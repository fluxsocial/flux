import { Profile, UserState } from "@/store/types";
import { useUserStore } from "..";

export default {
  getProfile(): Profile | null {
    const store = useUserStore();
    return store.profile;
  },
  getUser(): UserState | null {
    const store = useUserStore();
    return store;
  },
  getFluxPerspectiveId(): string | undefined {
    const store = useUserStore();
    return store.fluxPerspectiveId;
  },
};
