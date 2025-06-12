import { generateGUID } from "./sharedFuncs";

class DDCRegistry {
    constructor(name, id, description, version) {
        this.name = name;
        this.id = id;
        this.description = description;
        this.version = version;
        this.GUID = generateGUID();
    }
}

export { DDCRegistry };
export default { DDCRegistry };