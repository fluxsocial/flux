import { ad4mClient } from "@/app";
import { FluxExpressionReference, ExpressionTypes } from "@/store/types";
import { LinkExpression } from "@perspect3vism/ad4m";

export async function getTypedExpressionLanguages(
  links: LinkExpression[]
): Promise<FluxExpressionReference[]> {
  const typedExpressionLanguages = [];
  //Get and cache the expression UI for each expression language
  //And used returned expression language names to populate typedExpressionLanguages field
  for (const link of links) {
    if (link.data.predicate == "language") {
      const languageRes = await ad4mClient.languages.byAddress(
        link.data.target!
      );
      if (!languageRes) {
        throw Error(
          `Could not find language with address: ${link.data.target}`
        );
      }
      let expressionType;
      if (languageRes.name!.endsWith("group-expression")) {
        expressionType = ExpressionTypes.GroupExpression;
      } else if (languageRes.name!.endsWith("profile-expression")) {
        expressionType = ExpressionTypes.ProfileExpression;
      } else {
        expressionType = ExpressionTypes.Other;
      }
      typedExpressionLanguages.push({
        languageAddress: link.data.target!,
        expressionType: expressionType,
      } as FluxExpressionReference);
    }
  }
  return typedExpressionLanguages;
}
