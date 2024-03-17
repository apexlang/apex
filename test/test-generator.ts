import * as model from "@apexlang/core/model";

type Context = model.Context;

export default class DefaultVisitor extends model.BaseVisitor {
  override visitContextBefore(context: Context): void {
    super.visitContextBefore(context);
    this.write("start");
  }

  override visitContextAfter(context: Context): void {
    super.visitContextAfter(context);
    this.write("end");
  }
}
