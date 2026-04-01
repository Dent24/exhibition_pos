import{a as v,u as y}from"./CxOUjydu.js";import{O as b,o as w,i as a,m as q}from"./CvWUlVUA.js";const g=()=>{const s=v(),l=y(),d=a([]),u=a(null),o=a([]),r=a([]),n=a(!1),f=q(()=>r.value.reduce((e,t)=>e+t.event_price*t.quantity,0)),m=async()=>{if(!l.profile?.id)return;const{data:e,error:t}=await s.from("Exhibition_Booths").select("id, booth_number, exhibitions:exhibition_id (name)").eq("owner_id",l.profile.id);t||(d.value=e?.map(i=>({id:i.id,exhibition_name:`${i.exhibitions.name} (${i.booth_number})`}))||[])};b(u,async e=>{if(!e){o.value=[];return}n.value=!0;try{const{data:t,error:i}=await s.from("Exhibition_Product_Details").select(`
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
        `).eq("booth_id",e).eq("product.permissions.enable",!0).eq("product.permissions.owner_id",l.profile?.id);if(i)throw i;o.value=(t||[]).filter(c=>c.product!==null)}catch(t){console.error("POS 商品載入失敗:",t),o.value=[]}finally{n.value=!1}});const _=e=>{if(e.is_paid){alert("此商品賣家已結清，無法再販售！");return}const t=e.product.total_inventory,i=r.value.find(c=>c.id===e.id);if(i){if(i.quantity>=t){alert("已達庫存上限！");return}i.quantity++}else{if(t<=0){alert("商品已無庫存！");return}r.value.push({...e,quantity:1})}},h=async()=>{if(r.value.length!==0){n.value=!0;try{const e=r.value.map(i=>({detail_id:i.id,quantity:i.quantity})),{error:t}=await s.rpc("pos_checkout",{p_items:e});if(t)throw t;alert("結帳成功！"),r.value=[],await p()}catch(e){console.error("結帳失敗:",e.message),e.message.includes("已完成收款確認")?alert("結帳失敗：部分商品已被賣家確認收款鎖定，請移除後再結帳。"):e.message.includes("庫存不足")?alert("結帳失敗：部分商品庫存不足。"):alert("結帳失敗："+e.message),await p()}finally{n.value=!1}}},p=async()=>{if(!u.value)return;const{data:e}=await s.from("Exhibition_Product_Details").select(`
        id, event_price,
        product:product_id ( id, name, total_inventory, permissions:Product_Permissions!inner (enable, owner_id) )
      `).eq("booth_id",u.value).eq("product.permissions.enable",!0);o.value=(e||[]).filter(t=>t.product!==null)};return w(m),{booths:d,selectedBooth:u,products:o,cart:r,totalAmount:f,addToCart:_,checkout:h,loading:n}};export{g as u};
