import * as model from "https://deno.land/x/apex_core@v0.1.2/model/mod.ts";

type Context = model.Context;

export default class DefaultVisitor extends model.BaseVisitor {
  visitContextBefore(context: Context): void {
    super.visitContextBefore(context);
    this.write("start");
  }

  visitContextAfter(context: Context): void {
    super.visitContextAfter(context);
    this.write("end");
  }
}
