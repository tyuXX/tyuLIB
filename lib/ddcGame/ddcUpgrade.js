import { generateGUID } from "../sharedFuncs.js";
import { Currency } from "./ddcCurrency.js";

class DefUpgrade {
  constructor(name, id, dLevel) {
    this.GUID = generateGUID();
    this.name = name;
    this.id = id;
    this.dLevel = dLevel;
  }
}

class Upgrade extends DefUpgrade {
  constructor(name, id, level = 1, maxlevel = undefined) {
    this.GUID = generateGUID();
    this.name = name;
    this.id = id;
    this.level = level;
    this.maxlevel = maxlevel;
  }

  upgrade() {
    if (this.maxlevel && this.level >= this.maxlevel) {
      return false;
    }
    this.level++;
    return true;
  }

  downgrade() {
    if (this.level <= 0) {
      return false;
    }
    this.level--;
    return true;
  }

  reset() {
    this.level = 1;
  }
}
