import{u as T,a as A}from"./ArdkDjad.js";import{d as H,o as J,H as R,F as e,f as i,i as M,A as c,E as n,C as b,B,I as S,M as I,l as L,G as d,D as _,J as N,_ as O}from"./B6LfACNk.js";const Q={class:"d-flex align-center"},W={class:"font-weight-bold mr-3"},K={class:"d-flex align-center justify-end"},U={class:"text-success font-weight-bold mr-3"},X={key:0,class:"pa-4 text-center text-grey"},Y=H({__name:"product-sales-report",setup(Z){const $=T(),z=A(),C=M(!1),P=M([]),D=async()=>{if(z.profile?.id){C.value=!0;try{const{data:f,error:r}=await $.from("Products").select(`
        id, 
        name,
        details:Exhibition_Product_Details (
          id, event_price, is_paid,
          booth:booth_id ( 
            id, booth_number, 
            owner:owner_id ( nickname ),
            exhibition:exhibition_id ( id, name )
          ),
          sales:Sales_Records ( quantity )
        ),
        bundle_shares:Bundle_Items (
          share_weight,
          bundle:bundle_id (
            id, name,
            details:Exhibition_Product_Details (
              id, event_price, is_paid,
              booth:booth_id ( 
                id, booth_number, 
                owner:owner_id ( nickname ),
                exhibition:exhibition_id ( id, name )
              ),
              sales:Sales_Records ( quantity ),
              bundle:bundle_id (
                items:Bundle_Items ( share_weight )
              )
            )
          )
        )
      `).eq("seller_id",z.profile.id);if(r)throw r;P.value=(f||[]).map(a=>{let x=0,h=0;const u={},E=(t,l,o,s,m,y,g)=>{o!==0&&(x+=o,h+=s,u[t.id]||(u[t.id]={id:t.id,name:t.name,ex_total_qty:0,ex_total_rev:0,booths:[]}),u[t.id].ex_total_qty+=o,u[t.id].ex_total_rev+=s,u[t.id].booths.push({detail_id:m,is_paid:y,booth_info:`${l.booth_number} (${l.owner.nickname})`,source_name:g,event_price:(s/o).toFixed(0),quantity:o,revenue:Math.round(s)}))};return a.details.forEach(t=>{const l=t.sales.reduce((s,m)=>s+m.quantity,0),o=l*t.event_price;E(t.booth.exhibition,t.booth,l,o,t.id,t.is_paid,"一般單品")}),a.bundle_shares.forEach(t=>{const l=t.bundle;l&&l.details.forEach(o=>{const s=o.sales.reduce((k,w)=>k+w.quantity,0);if(s===0)return;const m=o.bundle.items.reduce((k,w)=>k+(w.share_weight||0),0),y=m>0?t.share_weight/m:0,g=s*o.event_price*y;E(o.booth.exhibition,o.booth,s,g,o.id,o.is_paid,`組合包: ${l.name}`)})}),{...a,total_quantity:x,total_revenue:Math.round(h),exhibitions:Object.values(u)}})}catch(f){console.error(f)}finally{C.value=!1}}},V=async f=>{if(!f){console.error("錯誤：detailId 為空，無法執行更新。"),alert("系統錯誤：找不到該項目的識別碼，請重新整理頁面。");return}if(confirm("確定已收到此攤位的款項嗎？確認後該筆銷售紀錄將鎖定。")){C.value=!0;try{const{error:a}=await $.from("Exhibition_Product_Details").update({is_paid:!0}).eq("id",f);if(a)throw a;await D(),alert("收款確認成功！該項目已鎖定。")}catch(a){alert("確認收款失敗: "+a.message)}finally{C.value=!1}}};return J(D),(f,r)=>{const a=i("v-col"),x=i("v-row"),h=i("v-chip"),u=i("v-expansion-panel-title"),E=i("v-divider"),t=i("v-icon"),l=i("v-list-item-title"),o=i("v-list-item-subtitle"),s=i("v-btn"),m=i("v-data-table"),y=i("v-list-item"),g=i("v-list"),k=i("v-expansion-panel-text"),w=i("v-expansion-panel"),F=i("v-expansion-panels"),j=i("v-container");return c(),R(j,null,{default:e(()=>[n(x,{align:"end",class:"mb-10"},{default:e(()=>[n(a,null,{default:e(()=>[...r[0]||(r[0]=[b("p",{class:"text-display-medium font-weight-black text-black mb-2"}," 商品銷售統計 ",-1),b("p",{class:"text-grey-darken-1 mb-0"},"查看商品在各展覽的銷售表現",-1)])]),_:1})]),_:1}),n(F,{multiple:"",variant:"inset"},{default:e(()=>[(c(!0),B(S,null,I(L(P),v=>(c(),R(w,{key:v.id,class:"mb-4 border"},{default:e(()=>[n(u,{class:"bg-grey-lighten-4"},{default:e(()=>[n(x,{"no-gutters":"",align:"center"},{default:e(()=>[n(a,{cols:"4",class:"text-h6 font-weight-black text-primary"},{default:e(()=>[d(_(v.name),1)]),_:2},1024),n(a,{cols:"8",class:"text-right pr-4"},{default:e(()=>[n(h,{color:"primary",variant:"flat",size:"small",class:"mr-2"},{default:e(()=>[d("總銷量: "+_(v.total_quantity),1)]),_:2},1024),n(h,{color:"success",variant:"flat",size:"small"},{default:e(()=>[d("總營收: $"+_(v.total_revenue),1)]),_:2},1024)]),_:2},1024)]),_:2},1024)]),_:2},1024),n(k,{class:"pa-0"},{default:e(()=>[n(g,{lines:"two",class:"pa-0"},{default:e(()=>[(c(!0),B(S,null,I(v.exhibitions,(q,G)=>(c(),B(S,{key:q.id},[G!==0?(c(),R(E,{key:0})):N("",!0),n(y,null,{prepend:e(()=>[n(t,{icon:"mdi-calendar-check",color:"blue"})]),default:e(()=>[n(l,{class:"font-weight-bold text-subtitle-1"},{default:e(()=>[d(_(q.name),1)]),_:2},1024),n(o,null,{default:e(()=>[d(" 展覽小計: "+_(q.ex_total_qty)+" 件 | 營收貢獻: $"+_(q.ex_total_rev),1)]),_:2},1024),n(m,{headers:[{title:"攤位 (攤主) / 來源項目",key:"booth_info"},{title:"拆算單價",key:"event_price",align:"center"},{title:"總銷量",key:"quantity",align:"center"},{title:"應得營收",key:"revenue",align:"end"}],items:q.booths,density:"compact","hide-default-footer":"",class:"mt-3 border rounded shadow-sm"},{"item.booth_info":e(({item:p})=>[b("div",Q,[b("div",W,_(p.booth_info),1),n(h,{size:"x-small",color:p.source_name==="一般單品"?"grey":"purple",variant:"tonal"},{default:e(()=>[n(t,{start:"",size:"10"},{default:e(()=>[d(_(p.source_name==="一般單品"?"mdi-tag":"mdi-package-variant"),1)]),_:2},1024),d(" "+_(p.source_name),1)]),_:2},1032,["color"])])]),"item.revenue":e(({item:p})=>[b("div",K,[b("span",U,"$"+_(p.revenue),1),p.is_paid?(c(),R(h,{key:1,size:"x-small",color:"blue",variant:"flat","prepend-icon":"mdi-check-circle"},{default:e(()=>[...r[2]||(r[2]=[d(" 已結清 ",-1)])]),_:1})):(c(),R(s,{key:0,size:"x-small",color:"orange-darken-1",onClick:ee=>V(p.detail_id)},{default:e(()=>[...r[1]||(r[1]=[d(" 確認收款 ",-1)])]),_:1},8,["onClick"]))])]),_:1},8,["items"])]),_:2},1024)],64))),128))]),_:2},1024),v.exhibitions.length===0?(c(),B("div",X," 此商品尚未在任何展覽上架 ")):N("",!0)]),_:2},1024)]),_:2},1024))),128))]),_:1})]),_:1})}}}),oe=O(Y,[["__scopeId","data-v-d204d4c5"]]);export{oe as default};
