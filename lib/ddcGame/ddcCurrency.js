import { DDCRegistry } from "../ddcLIB/ddcRegistry.js";
import { generateGUID } from "../sharedFuncs.js";
import { LargeNumber, ExtremelyLargeNumber } from "../ddcLIB/ddcELN.js";

class Currency {
  constructor(name, id, symbol, value, ddcRegistry) {
    this.name = name;
    this.id = id;
    this.symbol = symbol;
    this.value = value;
    this.GUID = generateGUID();
    this.ddcRegistry = ddcRegistry;
  }
  convertTo(currency, amount) {
    return (amount * this.value) / currency.value;
  }
  convertFrom(currency, amount) {
    return (amount * currency.value) / this.value;
  }
}

// Interface method
function convertCurrency(currencyFrom, currencyTo, amount) {
  return currencyFrom.convertTo(currencyTo, amount);
}

class CurrencyRegistry extends DDCRegistry {
  constructor(currencies = []) {
    super("Currency Registry", "currencyRegistry", "A registry for currencies", "1.0");
    this.currencies = currencies;
    this.amounts = {};
    this.currencies.forEach(currency => {
      this.amounts[currency.id] = 0;
    });
  }
  addCurrency(currency) {
    this.currencies.push(currency);
    this.amounts[currency.id] = 0;
  }
  getCurrency(id) {
    return this.currencies.find((currency) => currency.id === id);
  }
  convertCurrency(fromId, toId, amount) {
    const fromCurrency = this.getCurrency(fromId);
    const toCurrency = this.getCurrency(toId);
    if (!fromCurrency || !toCurrency) {
      throw new Error("Invalid currency ID(s)");
    }
    return fromCurrency.convertTo(toCurrency, amount);
  }
}

export { Currency, CurrencyRegistry, convertCurrency };
export default { Currency, CurrencyRegistry, convertCurrency };