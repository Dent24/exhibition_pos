import{u as q,a as x}from"./C2dVcHEB.js";import{O as P,o as S,i,m as k}from"./BsmMHUgW.js";const M=()=>{const c=q(),_=x(),h=i([]),r=i(null),s=i([]),o=i([]),u=i(!1),l=i({phone:""}),m=e=>e.bundle_id?e.bundle?.items?.length?Math.min(...e.bundle.items.map(t=>t.product?.total_inventory||0)):0:e.product?.total_inventory||0,v=e=>e.bundle_id?e.bundle.name:e.product?.name,y=k(()=>o.value.reduce((e,t)=>e+t.event_price*t.quantity,0)),d=async()=>{if(!r.value){s.value=[];return}u.value=!0;try{const{data:e,error:t}=await c.from("Exhibition_Product_Details").select(`
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
        `).eq("booth_id",r.value).or("product_id.not.is.null, bundle_id.not.is.null");if(t)throw t;s.value=(e||[]).map(n=>{const a=m(n),p=v(n);return{...n,computed_inventory:a,display_name:p}})}catch(e){console.error("POS 商品載入失敗:",e),s.value=[]}finally{u.value=!1}},b=async()=>{if(!_.profile?.id)return;const{data:e,error:t}=await c.from("Exhibition_Booths").select("id, booth_number, exhibitions:exhibition_id (name)").eq("owner_id",_.profile.id);t||(h.value=e?.map(n=>({id:n.id,exhibition_name:`${n.exhibitions.name} (${n.booth_number})`}))||[])};P(r,d);const w=e=>{if(e.is_paid)return alert("此項目已結清！");const t=e.computed_inventory,n=o.value.find(a=>a.id===e.id);if(n){if(n.quantity>=t)return alert("已達庫存上限！");n.quantity++}else{if(t<=0)return alert("已無庫存！");o.value.push({...e,quantity:1})}},g=async e=>{if(o.value.length!==0&&r.value){if(!l.value.phone){alert("請輸入聯絡電話以產生訂單編號");return}u.value=!0;try{const t=o.value.map(f=>({detail_id:f.id,quantity:f.quantity})),{data:n,error:a}=await c.rpc("pos_checkout_v3",{p_booth_id:r.value,p_items:t,p_method:e,p_phone:l.value.phone});if(a)throw a;const p=n[0];alert(`結帳成功！
訂單編號：${p.r_order_number}`),o.value=[],l.value.phone="",await d()}catch(t){console.error("結帳失敗:",t.message),alert("結帳失敗："+t.message),await d()}finally{u.value=!1}}};return S(b),{booths:h,selectedBooth:r,products:s,cart:o,totalAmount:y,addToCart:w,checkout:g,loading:u,fetchProducts:d,getInventory:m,getDisplayName:v,checkoutForm:l}};export{M as u};
