import { generateGUID } from "../ddcLIB/sharedFuncs.js";
import { LZString } from "../external/lz-string.min.js";
const DDCSaveVersion = 1;
class DDCSave {
  constructor(data, gameVersion, saveVersion, GUID, saveID) {
    this.data = data;
    this.gameVersion = gameVersion;
    this.saveVersion = saveVersion;
    this.GUID = GUID;
    this.saveID = saveID;
  }
  saveToLocal() {
    localStorage.setItem(
      "DDCSave-" + this.saveID,
      LZString.compressToBase64(JSON.stringify(this))
    );
  }
}

function loadLocalSave(saveID) {
  let save = JSON.parse(LZString.decompressFromBase64(localStorage.getItem("DDCSave-" + saveID)));
  if(save.data && save.gameVersion && save.saveVersion && save.GUID && save.saveID){
    return new DDCSave(save.data, save.gameVersion, save.saveVersion, save.GUID, save.saveID);
  }
  return null;
}

function newSave(data, gameVersion, saveID) {
    return new DDCSave(data, gameVersion, DDCSaveVersion, generateGUID(), saveID);
}

export { DDCSave, loadLocalSave, newSave };
