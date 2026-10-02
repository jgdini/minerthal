const fs=require('fs'); const dir='C:/Claude Sites/minerthal-redesign/';
for (const f of ['index.html','resulthal.html','minerblock.html','clicq.html']) {
  const h=fs.readFileSync(dir+f,'utf8'); const scripts=[...h.matchAll(/<script(?![^>]*ld\+json)[^>]*>([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  const ld=[...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map(m=>m[1]);
  let ok=true; scripts.forEach((s,i)=>{ try{ new Function(s) }catch(e){ ok=false; console.log(f,'script',i,'ERRO:',e.message) } });
  ld.forEach((s,i)=>{ try{ JSON.parse(s) }catch(e){ ok=false; console.log(f,'json-ld',i,'ERRO:',e.message) } });
  const merged=h.split('\n').filter(l=>/\/\/[^\n]*\s{2,}(const|let|document|if|function)\b/.test(l));
  console.log(f, ok?'scripts ok':'COM ERRO', '| scripts:',scripts.length,'| json-ld:',ld.length, merged.length?'| linhas suspeitas: '+merged.map(l=>l.trim().slice(0,80)).join(' || '):'');
}