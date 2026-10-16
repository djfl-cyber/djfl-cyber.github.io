// Shared by the visitor renderer and local Studio. Add new directory templates
// here and in config-schema/project.configFiles to reuse the same editor.
export const directoryTemplates={
  friends:{label:'友链',imageLabel:'友链头像',grouped:true},
  navigation:{label:'导航',imageLabel:'导航图标',grouped:false}
};
export function directorySource(node){
  const source=node.type==='directory'?node.props?.source:
    node.type==='content'?({'friends-content':'friends','navigation-content':'navigation'})[node.id]:null;
  return typeof source==='string'&&Object.hasOwn(directoryTemplates,source)?source:null;
}
export function directoryEntries(settings,source,{includeHidden=false}={}){
  return (Array.isArray(settings[source])?settings[source]:[])
    .map((item,index)=>({...item,index}))
    .filter(item=>includeHidden||item.enabled!==false)
    .sort((a,b)=>(a.order??0)-(b.order??0));
}
