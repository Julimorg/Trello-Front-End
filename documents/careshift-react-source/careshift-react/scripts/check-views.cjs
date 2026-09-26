const fs=require('fs'),ts=require('typescript'),React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
require.extensions['.jsx']=(m,file)=>m._compile(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.CommonJS,esModuleInterop:true}}).outputText,file);
const {buildViews,initialFamily,nurses}=require('../app/care-views.jsx');
let count=0;
for(const response of [null,'accepted','declined'])for(const selected of [null,nurses[0]]){
 const state={role:'patient',page:'overview',wizard:1,selectedCare:'Thay băng & chăm sóc vết thương',requestCreated:!!selected,selectedNurse:selected,requestStatus:'Đang chờ phản hồi',nurseResponse:response};
 for(const [name,view] of Object.entries(buildViews(state,initialFamily))){const html=renderToStaticMarkup(view());if(!html||html.includes('[object Object]'))throw Error(name+' invalid markup');count++;}
}
const App=require('../app/page.jsx').default;const html=renderToStaticMarkup(React.createElement(App));
for(const token of ['CareShift','sidebarClose','familyLinkModal','sosModal','Trong 5 km'])if(!html.includes(token))throw Error('Missing '+token);
console.log(`Passed ${count} view renders and application shell render.`);
