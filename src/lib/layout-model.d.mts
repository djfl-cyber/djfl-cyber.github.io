export type Device='desktop'|'tablet'|'mobile';
export interface Layout {mode:'flow'|'grid'|'free';direction?:'row'|'column';columns?:number;columnWidths?:number[];gap?:number;height?:number;align?:string;justify?:string}
export interface LayoutNode {id:string;type:string;name?:string;props?:Record<string,any>;bindings?:Record<string,string>;when?:string;style?:Record<string,string|number>;layout?:Layout;responsive?:Partial<Record<'tablet'|'mobile',{style?:Record<string,string|number>;layout?:Layout;visible?:boolean}>>;children?:LayoutNode[];visible?:boolean;locked?:boolean}
export interface PageDocument {schemaVersion:1;id:string;title:string;route:string;scope?:string;breakpoints?:{mobile:number;desktop:number};root:LayoutNode}
export const SCHEMA_VERSION:1;
export const nodeTypes:string[];
export const styleKeys:string[];
export function safeUrl(value:unknown):boolean;
export function validatePage(document:unknown):PageDocument;
export function allNodes(document:PageDocument):{node:LayoutNode;parent:LayoutNode|null;depth:number}[];
export function effectiveNode(node:LayoutNode,device?:Device):LayoutNode;
export function readBinding(settings:any,key:string):any;
export function writeBinding(settings:any,key:string,value:unknown):void;
export function nodeProps(node:LayoutNode,settings:any):any;
export function pageCSS(document:PageDocument,settings?:any):string;
