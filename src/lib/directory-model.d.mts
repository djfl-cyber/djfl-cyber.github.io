import type {LayoutNode} from './layout-model.mjs';
export type DirectorySource='friends'|'navigation';
export interface DirectoryEntry {name:string;url:string;description:string;category:string;order:number;enabled:boolean;image?:string}
export const directoryTemplates:Record<DirectorySource,{label:string;imageLabel:string;grouped:boolean}>;
export function directorySource(node:LayoutNode):DirectorySource|null;
export function directoryEntries(settings:any,source:DirectorySource,options?:{includeHidden?:boolean}):(DirectoryEntry&{index:number})[];
