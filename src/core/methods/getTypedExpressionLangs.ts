import { getLanguage } from "@/core/queries/getLanguage";
import {
  JuntoExpressionReference,
  ExpressionTypes,
  ExpressionUIIcons,
} from "@/store";
import { Perspective } from "@perspect3vism/ad4m-types";
import { Store } from "vuex";

///NOTE: this function wont work in current setup and its still undecided if we want expression language hints on the perspective meta
///This behaviour should likely be deleted and achieved some other way
export async function getTypedExpressionLanguages<S>(
  perspective: Perspective,
  storeLanguageUI: boolean,
  store?: Store<S>
): Promise<JuntoExpressionReference[]> {
  const typedExpressionLanguages = [];
  //Get and cache the expression UI for each expression language
  //And used returned expression language names to populate typedExpressionLanguages field
  for (const link of perspective.links!) {
    if (link.data.predicate == "expressionLanguage") {
      console.log("JoinCommunity.vue: Fetching UI lang:", link.data.target);
      const languageRes = await getLanguage(link.data.target!);
      if (storeLanguageUI && store) {
        const uiData: ExpressionUIIcons = {
          languageAddress: link.data.target!,
          createIcon: languageRes.constructorIcon!.code!,
          viewIcon: languageRes.icon!.code!,
          name: languageRes.name!,
        };
        store!.commit({
          type: "addExpressionUI",
          value: uiData,
        });
      }
      let expressionType;
      switch (languageRes.name!) {
        case "junto-shortform":
          expressionType = ExpressionTypes.ShortForm;
          break;

        case "group-expression":
          expressionType = ExpressionTypes.GroupExpression;
          break;

        case "agent-profiles":
          expressionType = ExpressionTypes.ProfileExpression;
          break;

        default:
          expressionType = ExpressionTypes.Other;
      }
      typedExpressionLanguages.push({
        languageAddress: link.data.target!,
        expressionType: expressionType,
      } as JuntoExpressionReference);
    }
  }
  return typedExpressionLanguages;
}
