import{u as v,a as y}from"./DoI1R5cQ.js";import{O as b,o as w,i as a,m as q}from"./YQiaH3kh.js";const g=()=>{const c=v(),d=y(),p=a([]),s=a(null),n=a([]),i=a([]),r=a(!1),f=q(()=>i.value.reduce((t,e)=>t+e.event_price*e.quantity,0)),u=async()=>{if(!s.value){n.value=[];return}r.value=!0;try{const{data:t,error:e}=await c.from("Exhibition_Product_Details").select(`
          id, 
          event_price, 
          is_paid,
          product:product_id!inner (
            id,
            name,
            total_inventory,
            permissions:Product_Permissions!inner (
              enable,
              owner_id
            )
          )
        `).eq("booth_id",s.value).eq("product.permissions.enable",!0).eq("product.permissions.owner_id",d.profile?.id);if(e)throw e;n.value=(t||[]).filter(o=>o.product!==null)}catch(t){console.error("POS 商品載入失敗:",t),n.value=[]}finally{r.value=!1}},m=async()=>{if(!d.profile?.id)return;const{data:t,error:e}=await c.from("Exhibition_Booths").select("id, booth_number, exhibitions:exhibition_id (name)").eq("owner_id",d.profile.id);e||(p.value=t?.map(o=>({id:o.id,exhibition_name:`${o.exhibitions.name} (${o.booth_number})`}))||[])};b(s,u);const h=t=>{if(t.is_paid){alert("此商品賣家已結清，無法再販售！");return}const e=t.product.total_inventory,o=i.value.find(l=>l.id===t.id);if(o){if(o.quantity>=e){alert("已達庫存上限！");return}o.quantity++}else{if(e<=0){alert("商品已無庫存！");return}i.value.push({...t,quantity:1})}},_=async t=>{if(i.value.length!==0){r.value=!0;try{const e=i.value.map(l=>({detail_id:l.id,quantity:l.quantity})),{error:o}=await c.rpc("pos_checkout",{p_items:e,p_method:t});if(o)throw o;alert("結帳成功！"),i.value=[],await u()}catch(e){console.error("結帳失敗:",e.message),e.message.includes("已完成收款確認")?alert("結帳失敗：部分商品已被賣家確認收款鎖定，請移除後再結帳。"):e.message.includes("庫存不足")?alert("結帳失敗：部分商品庫存不足。"):alert("結帳失敗："+e.message),await u()}finally{r.value=!1}}};return w(m),{booths:p,selectedBooth:s,products:n,cart:i,totalAmount:f,addToCart:h,checkout:_,loading:r,fetchProducts:u}};export{g as u};
