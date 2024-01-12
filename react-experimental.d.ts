export * from "react";

declare module "react" {
  export function experimental_taintUniqueValue(
    errorMessage: string,
    liftetime: any,
    value: any
  ): void;
}
