import { generateGUID } from "../ddcLIB/sharedFuncs.js";
let activeLanguage = "en-us";

class Translator {
    constructor(langlist = [new Language()]) {
        this.langlist = langlist;
        this.GUID = generateGUID();
    }
    // Add a new language to the language list
    addLanguage(language) {
        this.langlist.push(language);
    }
    // Translate a given text by key using the language id; fallback returns the key if not found.
    translate(key, langId) {
        const lang = this.langlist.find(lang => lang.id === langId);
        return lang ? lang.getTranslation(key) : key;
    }
    // New method: translate the key using the active language.
    translateToActive(key) {
        return this.translate(key, activeLanguage);
    }
    translatePage(language) {
        document.querySelectorAll("[data-ddctranslate]").forEach(element => {
            let key = element.getAttribute("data-ddctranslate");
            if(this.translate(key, language) != key)
            {
                element.innerText = this.translate(key, language);
            }
            else{
                element.innerText = this.translate(key.toLowerCase(), language);
            }
        });
    }
    translatePageToActive() {
        this.translatePage(activeLanguage);
    }
    attachLanguageSelector(selector) {
        const selectElem = document.querySelector(selector);
        if (selectElem) {
            for (const lang of this.langlist) {
                const option = document.createElement("option");
                option.value = lang.id;
                option.textContent = lang.name;
                selectElem.appendChild(option);
            }
            selectElem.value = activeLanguage;
            selectElem.addEventListener("change", (e) => {
                setActiveLanguage(e.target.value);
                this.translatePageToActive();
            });
        }
    }
}

class Language {
    constructor(name = "Default", id = "en-us", dictionary = {}, hasCase = true, normalize = true) {
        this.name = name;
        this.id = id;
        this.dictionary = dictionary;
        this.GUID = generateGUID();
        this.hasCase = hasCase;
    }
    normalizeDictionary() {
        // Convert all keys to lowercase.
        const newDict = {};
        for (const key in this.dictionary) {
            newDict.set(key.toLowerCase(), this.dictionary.get(key));
        }
        this.dictionary = newDict;
        // Convert all values to lowercase.
        for (const key in this.dictionary) {
            this.dictionary.get(key) = this.dictionary.get(key).toLowerCase();
        }
    }
    // Retrieve translation for a given key; returns key if translation is not available.
    getTranslation(key) {
        if(this.hasCase) {
            // Set the result string to have the same capitalization as the key.
            if(key[0] === key[0].toUpperCase()) {
                return (this.dictionary.get(key)[0].toUpperCase() + this.dictionary.get(key).slice(1)) ||key;
            }
        }
        return this.dictionary.get(key) || key;
    }
}

function setActiveLanguage(lang) {
    activeLanguage = lang;
    localStorage.setItem("lastLanguage", lang);
}

function recoverLastLanguage() {
    const lastLang = localStorage.getItem("lastLanguage");
    if (lastLang) {
        activeLanguage = lastLang;
    }
}

export { Translator, Language, activeLanguage, setActiveLanguage, recoverLastLanguage };