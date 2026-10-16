import * as settings from './settings';
import {readLayout} from 'virtual:blog-layout-preview';
import {validatePage,type PageDocument} from './layout-model.mjs';
const documents=import.meta.glob<{default:PageDocument}>('../config/layouts/*.json',{eager:true});
export async function layout(id:string,request?:Request){const initial=documents[`../config/layouts/${id}.json`]?.default;const override=await readLayout(id,request);const document=override?.document??initial;return {document:document?validatePage(document):null,settings:{...settings,...override?.settings}};}
