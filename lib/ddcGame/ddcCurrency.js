import { DDCRegistry } from "../ddcLIB/ddcRegistry.js";
import { generateGUID } from "../sharedFuncs.js";

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
}

export { Currency, CurrencyRegistry };
