import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import { ad4mConnect } from "@/ad4mConnect";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/signup",
    name: "signup",
    component: () => import(`@/views/signup/SignUp.vue`),
  },
  {
    path: "/update-ad4m",
    name: "update-ad4m",
    component: () => import(`@/views/update/UpdateAd4m.vue`),
  },
  {
    path: "/",
    name: "main",
    component: () => import(`@/views/main/MainView.vue`),
    redirect: { name: "home" },
    children: [
      {
        path: "home",
        name: "home",
        component: () => import(`@/views/profile/ProfileView.vue`),
      },
      {
        path: "communities/:communityId",
        props: true,
        name: "community",
        component: () => import(`@/views/community/CommunityView.vue`),
        children: [
          {
            path: ":channelId",
            props: true,
            name: "channel",
            component: () => import(`@/views/channel/ChannelView.vue`),
          },
        ],
      },
      {
        path: "profile/:did",
        props: true,
        name: "profile",
        component: () => import(`@/views/profile/ProfileView.vue`),
      },
      {
        path: "settings",
        name: "settings",
        component: () => import(`@/containers/Settings.vue`),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

router.beforeEach(async (to, from, next) => {
  try {
    const isAuthenticated = await ad4mConnect.isAuthenticated();

    if (isAuthenticated) {
      const client = await ad4mConnect.getAd4mClient();
      const me = await client.agent.me();

      const fluxLinksFound = me?.perspective?.links.find((e) =>
        e.data.source.startsWith("flux://")
      );

      const isOnSignupOrMain = to.name === "signup" || to.name === "main";

      if (fluxLinksFound && isOnSignupOrMain) {
        next("/home");
      }

      if (!fluxLinksFound && !isOnSignupOrMain) {
        next("/signup");
      }

      next();
    } else {
      if (to.name !== "signup") {
        next("/signup");
      }

      next();
    }
  } catch (e) {
    console.log("error in route", e);
    if (to.name !== "signup") {
      next("/signup");
    } else {
      next();
    }
  }
});

export default router;
