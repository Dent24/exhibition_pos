import{u as w,a as g}from"./DsNTg7H8.js";import{O as q,o as x,i as a,m as P}from"./v0z4rONU.js";const I=()=>{const d=w(),c=g(),_=a([]),s=a(null),u=a([]),o=a([]),i=a(!1),p=e=>e.bundle_id?e.bundle?.items?.length?Math.min(...e.bundle.items.map(t=>t.product?.total_inventory||0)):0:e.product?.total_inventory||0,m=e=>e.bundle_id?e.bundle.name:e.product?.name,f=P(()=>o.value.reduce((e,t)=>e+t.event_price*t.quantity,0)),l=async()=>{if(!s.value){u.value=[];return}i.value=!0;try{const{data:e,error:t}=await d.from("Exhibition_Product_Details").select(`
          id, 
          event_price, 
          is_paid,
          bundle_id,
          product:product_id (
            id, name, total_inventory,
            permissions:Product_Permissions!inner ( enable, owner_id )
          ),
          bundle:bundle_id (
            id, name,
            items:Bundle_Items (
              share_weight,
              product:product_id ( id, name, total_inventory )
            )
          )
        `).eq("booth_id",s.value).or("product_id.not.is.null, bundle_id.not.is.null");if(t)throw t;u.value=(e||[]).map(n=>{const r=p(n),b=m(n);return{...n,computed_inventory:r,display_name:b}})}catch(e){console.error("POS 商品載入失敗:",e),u.value=[]}finally{i.value=!1}},h=async()=>{if(!c.profile?.id)return;const{data:e,error:t}=await d.from("Exhibition_Booths").select("id, booth_number, exhibitions:exhibition_id (name)").eq("owner_id",c.profile.id);t||(_.value=e?.map(n=>({id:n.id,exhibition_name:`${n.exhibitions.name} (${n.booth_number})`}))||[])};q(s,l);const v=e=>{if(e.is_paid)return alert("此項目已結清！");const t=e.computed_inventory,n=o.value.find(r=>r.id===e.id);if(n){if(n.quantity>=t)return alert("已達庫存上限！");n.quantity++}else{if(t<=0)return alert("已無庫存！");o.value.push({...e,quantity:1})}},y=async e=>{if(o.value.length!==0){i.value=!0;try{const t=o.value.map(r=>({detail_id:r.id,quantity:r.quantity})),{error:n}=await d.rpc("pos_checkout",{p_items:t,p_method:e});if(n)throw n;alert("結帳成功！"),o.value=[],await l()}catch(t){console.error("結帳失敗:",t.message),t.message.includes("已完成收款確認")?alert("結帳失敗：部分商品已被賣家確認收款鎖定，請移除後再結帳。"):t.message.includes("庫存不足")?alert("結帳失敗：部分商品庫存不足。"):alert("結帳失敗："+t.message),await l()}finally{i.value=!1}}};return x(h),{booths:_,selectedBooth:s,products:u,cart:o,totalAmount:f,addToCart:v,checkout:y,loading:i,fetchProducts:l,getInventory:p,getDisplayName:m}};export{I as u};
