'use client';
import React,{useState,useEffect,useRef} from 'react';
import {Shell,buildViews,roles,nurses,initialFamily,icons} from './care-views';

const initial={role:'patient',page:'overview',wizard:1,selectedCare:'Thay băng & chăm sóc vết thương',requestCreated:false,selectedNurse:null,requestStatus:'Chưa có yêu cầu',nurseResponse:null};
export default function CareShift(){
 const [state,setState]=useState(initial),[family,setFamily]=useState(initialFamily);
 const [modal,setModal]=useState(null),[roleMenu,setRoleMenu]=useState(false),[nav,setNav]=useState(false);
 const [toasts,setToasts]=useState([]),[detail,setDetail]=useState(null),[form,setForm]=useState({});
 const [verified,setVerified]=useState([]);const root=useRef(null);
 const change=patch=>setState(s=>({...s,...patch}));
 const toast=(title,message)=>{const id=Date.now()+Math.random();setToasts(t=>[...t,{id,title,message}]);setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),4200)};
 const go=page=>{change({page});setNav(false)};
 const setRole=role=>{change({role,page:'overview'});setRoleMenu(false);setNav(false)};
 useEffect(()=>{document.body.style.overflow=nav||modal?'hidden':'';return()=>{document.body.style.overflow=''}},[nav,modal]);
 useEffect(()=>{const fn=e=>{if(e.key==='Escape'){setNav(false);setModal(null);setRoleMenu(false)}};document.addEventListener('keydown',fn);return()=>document.removeEventListener('keydown',fn)},[]);
 const current=useRef({state,change,setRole});current.current={state,change,setRole};
 useEffect(()=>{const mc=document.modelContext;if(!mc?.registerTool)return;const lifecycle=new AbortController();for(const tool of [{name:'create_care_request',description:'Create a demo care request and display matches.',inputSchema:{type:'object',properties:{careType:{type:'string'}},required:['careType'],additionalProperties:false},execute(input){if(typeof input?.careType!=='string'||!input.careType.trim())throw Error('careType required');current.current.setRole('patient');current.current.change({selectedCare:input.careType,requestCreated:true,page:'request'});return{status:'matched',matches:3}}},{name:'respond_to_care_request',description:'Accept or decline the demo request.',inputSchema:{type:'object',properties:{decision:{type:'string',enum:['accept','decline']}},required:['decision'],additionalProperties:false},execute(input){if(!['accept','decline'].includes(input?.decision))throw Error('Invalid decision');current.current.change({nurseResponse:input.decision==='accept'?'accepted':'declined',role:'nurse',page:'requests'});return{status:input.decision}}}])Promise.resolve(mc.registerTool({...tool,annotations:{readOnlyHint:false,untrustedContentHint:false}},{signal:lifecycle.signal})).catch(()=>{});return()=>lifecycle.abort()},[]);
 const choose=id=>{change({selectedNurse:nurses.find(n=>n.id===id),requestStatus:'Đang chờ phản hồi',nurseResponse:null,page:'overview'});setModal(null);toast('Đã gửi yêu cầu đến '+nurses.find(n=>n.id===id).name,'Điều dưỡng có 15 phút để chấp nhận hoặc từ chối.')};
 const primary=family.find(f=>f.primary&&f.status==='Đã liên kết')||family.find(f=>f.status==='Đã liên kết');
 function click(e){
  if(e.target.classList.contains('modal-backdrop')){setModal(null);return}
  const b=e.target.closest('button,[data-page-jump]');if(!b)return;const d=b.dataset,id=b.id;
  if(d.close){setModal(null);return}
  if(d.role){setRole(d.role);return}if(d.page){go(d.page);return}if(d.pageJump){go(d.pageJump);return}
  if(id==='roleSwitcher'){setRoleMenu(x=>!x);return}if(id==='mobileMenu'){setNav(true);return}if(['sidebarClose','navBackdrop'].includes(id)){setNav(false);return}
  if(d.action==='new-request'){change({wizard:1});setModal('careModal');return}if(d.action==='add-nurse'){setModal('addNurseModal');return}if(d.action==='link-family'){setModal('familyLinkModal');return}
  if(d.value){change({selectedCare:d.value});return}
  if(id==='wizardBack'){change({wizard:Math.max(1,state.wizard-1)});return}
  if(id==='wizardNext'){const f=root.current.querySelector('#careForm');setForm(Object.fromEntries(new FormData(f)));if(state.wizard<3){change({wizard:state.wizard+1});return}change({requestCreated:true,requestStatus:'Đang matching',role:'patient',page:'request'});setModal(null);toast('Đã tạo yêu cầu #CR-260917-042','Tìm thấy 3 điều dưỡng phù hợp trong bán kính 5 km.');return}
  if(d.nurseView){setDetail(nurses.find(n=>n.id===d.nurseView));setModal('nurseModal');return}if(d.nurseSelect){choose(d.nurseSelect);return}if(id==='selectFromDetail'){choose(detail.id);return}
  if(d.nurseResponse){change({nurseResponse:d.nurseResponse});toast(d.nurseResponse==='accepted'?'Đã xác nhận nhận ca':'Đã từ chối ca',d.nurseResponse==='accepted'?'Bệnh nhân đã được thông báo và lịch đã được cập nhật.':'CareShift sẽ gửi yêu cầu tới điều dưỡng phù hợp tiếp theo.');return}
  if(d.verify){setVerified(x=>[...x,d.verify]);toast('Cấp phép thành công','Điều dưỡng đã được đưa vào nguồn matching.');return}
  if(d.familyPrimary){setFamily(x=>x.map(f=>({...f,primary:f.id===d.familyPrimary})));toast('Đã đổi người liên hệ ưu tiên','Cảnh báo SOS sẽ được gửi tới người này trước.');return}
  if(id==='sosButton'){setModal('sosModal');return}
  if(d.sos){setModal(null);if(d.sos==='Báo người thân'&&!primary){setModal('familyLinkModal');return}toast(d.sos==='Báo người thân'?`Đã báo ${primary.name}`:d.sos,d.sos==='Báo người thân'?`Mô phỏng cảnh báo tới tài khoản ${primary.contact}; không gửi thông báo thật.`:'Mô phỏng — không gọi hoặc gửi cảnh báo thực tế.');return}
  if(id==='notificationButton')toast('Bạn đã cập nhật đầy đủ','Không có thông báo hệ thống chưa đọc.');
 }
 function submit(e){e.preventDefault();const f=new FormData(e.target);if(e.target.id==='addNurseForm'){toast('Đã lưu hồ sơ điều dưỡng','Hồ sơ đang chờ bệnh viện xác minh văn bằng và chứng chỉ.');setModal(null);e.target.reset()}
 if(e.target.id==='familyLinkForm'){const name=String(f.get('familyName')).trim();if(!name)return;const permissions=[];if(f.get('emergency'))permissions.push('Nhận cảnh báo SOS');if(f.get('schedule'))permissions.push('Xem lịch chăm sóc');if(f.get('status'))permissions.push('Xem trạng thái yêu cầu');setFamily(x=>[...x,{id:'family-'+Date.now(),name,initials:name.split(/\s+/).slice(-2).map(x=>x[0]).join('').toUpperCase(),relationship:String(f.get('relationship')),contact:String(f.get('familyContact')),status:'Chờ xác nhận',primary:false,permissions}]);setModal(null);change({role:'patient',page:'family'});toast('Đã tạo lời mời mẫu',`${name} cần xác nhận trước khi nhận cảnh báo SOS.`);e.target.reset()}}
 const r=roles[state.role],views=buildViews(state,family),content=(views[state.role+'_'+state.page]||views[state.role+'_overview'])();
 const navigation=r.nav.map(n=><button key={n[0]} className={state.page===n[0]?'active':''} data-page={n[0]}>{icons[n[2]]}<span>{n[1]}</span>{n[3]&&<span className="nav-badge">{n[3]}</span>}</button>);
 const review=<><h3>Tóm tắt yêu cầu</h3>{[['Nhu cầu',state.selectedCare],['Khu vực',(form.address||'Thảo Điền, Thành phố Thủ Đức')+' · bán kính 5 km'],['Thời gian',`20/09/2026 · ${form.time||'14:00'} · ${form.duration||'90 phút'}`],['Tần suất',form.frequency||'Một lần'],['Ghi chú',form.note]].map(([label,value])=><div key={label} className="review-row"><span>{label}</span><b>{value}</b></div>)}</>;
 const nurseDetail=detail&&<><div className="detail-hero"><div className="nurse-avatar">{detail.initials}</div><div><span className="eyebrow">Verified nurse profile</span><h2 id="nurseDetailTitle">{detail.name}</h2><span className="specialty">{detail.specialty} · {detail.hospital}</span><span className="verified">{icons.shield} Đã xác minh và cấp phép</span></div></div><div className="detail-stats">{[[detail.experience,'Kinh nghiệm'],[detail.cases,'Ca hoàn thành'],['★ '+detail.rating,'Đánh giá']].map(([v,l])=><div key={l} className="detail-stat"><b>{v}</b><small>{l}</small></div>)}</div><div className="detail-section"><h3>Chuyên môn phù hợp</h3><p style={{fontSize:'.76rem',color:'var(--muted)',margin:0}}>Chăm sóc vết thương sau phẫu thuật, thay băng vô khuẩn, theo dõi dấu hiệu nhiễm trùng và hướng dẫn người nhà.</p></div><div className="detail-section"><h3>Chứng chỉ hành nghề</h3><div className="credential">{icons.shield}<span><b>{detail.license}</b><small>Được {detail.hospital} đối chiếu · còn hiệu lực</small></span></div></div><div className="detail-actions"><button className="btn ghost" data-close="nurseModal">Để sau</button><button className="btn primary" id="selectFromDetail">Chọn {detail.name.split(' ').pop()}</button></div></>;
 // Render the original markup as React elements; no injected HTML or legacy DOM renderer.
 return <div ref={root} onClick={click} onSubmit={submit}><style>{`
 .modal-backdrop{display:none!important}.wizard-panel{display:none!important}.wizard-steps span{color:#94a4a7!important;font-weight:400!important}
 ${modal?'#'+modal+'{display:flex!important}':''}
 .wizard-panel[data-step="${state.wizard}"]{display:block!important}
 #wizardBar{width:${state.wizard*33.333}%!important}#wizardBack{visibility:${state.wizard===1?'hidden':'visible'}}
 ${[1,2,3].filter(n=>n<=state.wizard).map(n=>`[data-step-dot="${n}"]{color:var(--teal)!important;font-weight:750!important}`).join('')}
 #careOptions button[data-value="${state.selectedCare}"]{border-color:var(--teal);box-shadow:0 0 0 2px rgba(11,107,104,.1);background:#f8fffd}
 #roleMenu{display:${roleMenu?'block':'none'}}
 ${verified.map(id=>`[data-verify="${id}"]{opacity:.6;pointer-events:none}`).join('')}
 @media(max-width:780px){.sidebar{transform:translateX(${nav?'0':'-100%'})!important}#navBackdrop{display:${nav?'block':'none'}!important}}
 `}</style><Shell navigation={navigation} content={content} toastContent={toasts.map(t=><div key={t.id} className="toast"><span>✓</span><div><b>{t.title}</b><small>{t.message}</small></div></div>)} r={r} currentTitle={r.nav.find(n=>n[0]===state.page)?.[1]} familyLabel={primary?`${primary.name} · ${primary.relationship}`:'Chưa có người thân được liên kết'} review={review} nurseDetail={nurseDetail} wizardLabel={state.wizard===3?'Tìm điều dưỡng':'Tiếp tục'}/></div>
}
