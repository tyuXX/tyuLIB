import { DDCRegistry } from "../ddcLIB/ddcRegistry.js";
import { generateGUID } from "../sharedFuncs.js";

class DefUpgrade {
  constructor(name, id, dLevel) {
    this.GUID = generateGUID();
    this.name = name;
    this.id = id;
    this.dLevel = dLevel;
  }
}

class Upgrade extends DefUpgrade {
  constructor(name, id, requiredCurrency, reqirementFunc = (level, cache, requiredCurrency) => {}, onApply = (level, cache) => {}, level = 1, maxlevel = undefined, downgradeFunc = undefined) {
    super(name, id, level);
    this.name = name;
    this.id = id;
    this.level = level;
    this.maxlevel = maxlevel;
    this.requiredCurrency = requiredCurrency; // Currency object
    this.reqirementFunc = reqirementFunc; // Function to check if the upgrade can be applied
    this.onApply = onApply; // Function to apply the upgrade
    this.cache = {
      requiredCurrencyAmount: 0, // Amount of currency required for the upgrade
    }; // Cache for the upgrade
  }

  upgrade() {
    if (this.maxlevel && this.level >= this.maxlevel) {
      return false;
    }
    if (this.reqirementFunc(this.level, this.cache, this.requiredCurrency)) {
      return false;
    }
    this.level++;
    return true;
  }

  downgrade() {
    if (this.level <= 0) {
      return false;
    }
    if (this.downgradeFunc) {
      this.downgradeFunc(this.level, this.cache, this.requiredCurrency);
      return false;
    }
    this.level--;
    return true;
  }

  reset() {
    this.level = this.dLevel;
  }
}

class UpgradeRegistry extends DDCRegistry {
  constructor(upgrades = []) {
    super("Upgrade Registry", "upgradeRegistry", "A registry for upgrades", "1.0");
    this.upgrades = upgrades;
  }

  addUpgrade(upgrade) {
    this.upgrades.push(upgrade);
  }

  getUpgrade(id) {
    return this.upgrades.find((upgrade) => upgrade.id === id);
  }
}

export { DefUpgrade, Upgrade, UpgradeRegistry };