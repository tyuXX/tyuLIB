import { generateGUID } from "../ddcLIB/sharedFuncs.js";
import { LZString } from "../external/lz-string.min.js";
import { str_sha1 } from "../sha1.js";
const DDCSaveVersion = 1;
class DDCSave {
  constructor(data, gameVersion, saveVersion, GUID, saveID) {
    this.data = data;
    this.gameVersion = gameVersion;
    this.saveVersion = saveVersion;
    this.GUID = GUID;
    this.saveID = saveID;
  }
  ToString() {
    let sv = LZString.compressToBase64(JSON.stringify(this));
    return sv + "\n" + str_sha1(sv);
  }
  saveToLocal() {
    localStorage.setItem("DDCSave-" + this.saveID,this.ToString());
  }
}

function loadLocalSave(saveID) {
  if (!localStorage.getItem("DDCSave-" + saveID)) {
    return null;
  }
  let saveT = checkSaveIntegrity(
    localStorage.getItem("DDCSave-" + saveID)
  );
  let save = saveT.save;
  if (!saveT.success) {
    return null;
  }
  if (
    save.data &&
    save.gameVersion &&
    save.saveVersion &&
    save.GUID &&
    save.saveID
  ) {
    return new DDCSave(
      save.data,
      save.gameVersion,
      save.saveVersion,
      save.GUID,
      save.saveID
    );
  }
  return null;
}

function newSave(data, gameVersion, saveID) {
  return new DDCSave(data, gameVersion, DDCSaveVersion, generateGUID(), saveID);
}

function checkSaveIntegrity(saveStr) {
  let [sv, sha] = saveStr.split("\n");
  if (str_sha1(sv) !== sha) {
    return { success: false, save: null };
  }
  return { success: true, save: JSON.parse(LZString.decompressFromBase64(sv)) };
}

export { DDCSave, loadLocalSave, newSave };
