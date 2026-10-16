declare module 'virtual:blog-layout-preview' {
 export function readLayout(id:string,request?:Request):Promise<any>;
 export function previewOptions(request:Request):{includeDrafts:boolean;draft:boolean}|null;
}
