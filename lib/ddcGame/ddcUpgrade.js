import { generateGUID } from "../sharedFuncs.js";

class Upgrade {
  constructor(name, level = 1, maxlevel = undefined) {
    this.GUID = generateGUID();
  }
}
