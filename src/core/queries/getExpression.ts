import { apolloClient } from "@/app";

import { GET_EXPRESSION, GET_MANY_EXPRESSION } from "../graphql_queries";
import sleep from "@/utils/sleep";
import { ExpressionRendered } from "@perspect3vism/ad4m";

//Query expression handler
export function getExpression(url: string): Promise<ExpressionRendered> {
  return new Promise((resolve, reject) => {
    apolloClient
      .query<{
        expression: ExpressionRendered;
      }>({ query: GET_EXPRESSION, variables: { url: url } })
      .then((result) => {
        resolve(result.data.expression);
      })
      .catch((error) => reject(error));
  });
}

export function getExpressionNoCache(
  url: string
): Promise<ExpressionRendered | null> {
  return new Promise((resolve, reject) => {
    apolloClient
      .query<{
        expression: ExpressionRendered;
      }>({
        query: GET_EXPRESSION,
        variables: { url: url },
        fetchPolicy: "no-cache",
      })
      .then((result) => {
        resolve(result.data.expression);
      })
      .catch((error) => reject(error));
  });
}

export async function getExpressionAndRetry(
  url: string,
  retries: number,
  retryDelay: number
): Promise<ExpressionRendered | null> {
  let getExprRes = await getExpressionNoCache(url);
  if (getExprRes == null) {
    for (let i = 0; i < retries; i++) {
      //console.log("Retrying get of expression in getExpressionAndRetry");
      getExprRes = await getExpressionNoCache(url);
      if (getExprRes != null) {
        break;
      }
      await sleep(retryDelay * i);
    }
    if (getExprRes == null) {
      throw Error(`Could not get expression in ${retries} retries`);
    }
  }
  return getExprRes;
}

export async function getManyExpression(
  urls: string[]
): Promise<ExpressionRendered[]> {
  return new Promise((resolve, reject) => {
    apolloClient
      .query<{
        expressionMany: ExpressionRendered[];
      }>({ query: GET_MANY_EXPRESSION, variables: { urls: urls } })
      .then((result) => {
        resolve(result.data.expressionMany);
      })
      .catch((error) => reject(error));
  });
}
