export const componentId:RegExp;
export const componentVersion:RegExp;
export function packagePath(p:unknown):boolean;
export function validateManifest(value:any):any;
export function validateSchema(value:any,depth?:number):any;
export function validateComponentConfig(schema:any,value:any,at?:string):any;
export function defaultConfig(schema:any):any;
