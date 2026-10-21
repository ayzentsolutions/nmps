"use client";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUp, Copy, Eye, EyeOff, FilePlus2, GripVertical, Monitor, Smartphone, Tablet, Plus, Redo2, Save, Send, Trash2, Undo2, History } from "lucide-react";
import type { UserRole } from "@/models/User";

type Block = { id: string; type: string; visible: boolean; [key: string]: unknown };
type Content = { blocks: Block[]; seo: { title: string; description: string; ogImage: string } };
type PageItem = { id: string; title: string; slug: string; status: "draft" | "published" | "archived"; draftContent: Content; versionNumber: number; updatedAt: string };
type VersionItem = { id: string; versionNumber: number; title: string; slug: string; status: "draft" | "published"; createdAt: string; createdBy: string };
const emptyContent: Content = { blocks: [], seo: { title: "", description: "", ogImage: "" } };
const blockId = () => globalThis.crypto?.randomUUID?.() || String(Date.now()) + Math.random().toString(36).slice(2);
function makeBlock(type: string): Block {
  if (type === "hero") return { id: blockId(), type, visible: true, eyebrow: "Welcome", title: "A place to learn, grow, and lead.", subtitle: "Introduce your school in a few thoughtful words.", buttonLabel: "Discover our school", buttonHref: "/about" };
  if (type === "cta") return { id: blockId(), type, visible: true, title: "Take the next step", body: "Give families a clear next action.", buttonLabel: "Contact us", buttonHref: "/contact" };
  return { id: blockId(), type: "richText", visible: true, title: "Section heading", body: "Write meaningful content for families and students." };
}
function normalize(value: unknown): Content {
  if (!value || typeof value !== "object") return emptyContent;
  const content = value as Partial<Content>;
  return { blocks: Array.isArray(content.blocks) ? content.blocks as Block[] : [], seo: { title: content.seo?.title || "", description: content.seo?.description || "", ogImage: content.seo?.ogImage || "" } };
}
function PreviewBlock({ block }: { block: Block }) {
  if (!block.visible) return null;
  const title = String(block.title || "");
  if (block.type === "hero") return <div className="rounded-2xl bg-ink px-6 py-10 text-white"><p className="text-xs font-bold uppercase tracking-[.2em] text-gold">{String(block.eyebrow || "")}</p><h2 className="mt-3 text-3xl font-bold">{title}</h2><p className="mt-3 max-w-xl text-slate-200">{String(block.subtitle || "")}</p>{block.buttonLabel ? <span className="mt-6 inline-flex rounded-full bg-gold px-4 py-2 text-sm font-bold text-ink">{String(block.buttonLabel)}</span> : null}</div>;
  if (block.type === "cta") return <div className="rounded-2xl bg-teal px-6 py-7 text-white"><h2 className="text-2xl font-bold">{title}</h2><p className="mt-2">{String(block.body || "")}</p><span className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-sm font-bold text-ink">{String(block.buttonLabel || "Learn more")}</span></div>;
  if (block.type === "richText") return <section className="rounded-xl border border-slate-200 bg-white p-6"><h2 className="text-2xl font-bold text-ink">{title}</h2><p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">{String(block.body || "")}</p></section>;
  return <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Block type: {block.type}</strong><p className="mt-1">This block remains saved and renders on the public page. Its inspector will be available when the corresponding editor control is implemented.</p></section>;
}

export default function PageBuilder({ role }: { role: UserRole }) {
  const canEdit = ["super_admin","school_admin","editor"].includes(role);
  const canCreate = ["super_admin","school_admin","editor"].includes(role);
  const canPublish = ["super_admin","school_admin","publisher"].includes(role);
  const canDelete = ["super_admin","school_admin"].includes(role);
  const [pages,setPages] = useState<PageItem[]>([]);
  const [selected,setSelected] = useState("");
  const [title,setTitle] = useState("");
  const [slug,setSlug] = useState("");
  const [content,setContent] = useState<Content>(emptyContent);
  const [history,setHistory] = useState<Content[]>([]);
  const [future,setFuture] = useState<Content[]>([]);
  const [versions,setVersions] = useState<VersionItem[]>([]);
  const [showVersions,setShowVersions] = useState(false);
  const [newTitle,setNewTitle] = useState("");
  const [newSlug,setNewSlug] = useState("");
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState("");
  const [error,setError] = useState("");
  const [preview,setPreview] = useState(false);
  const [viewport,setViewport] = useState<"desktop"|"tablet"|"mobile">("desktop");
  const dragIndex = useRef<number|null>(null);

  function selectPage(page: PageItem) {
    setSelected(page.id); setTitle(page.title); setSlug(page.slug); setContent(normalize(page.draftContent));
    setHistory([]); setFuture([]); setMessage(""); setError(""); setShowVersions(false);
  }
  async function loadPages() {
    const response = await fetch("/api/v1/admin/pages?limit=50",{cache:"no-store"});
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load pages.");
    const items = result.data as PageItem[]; setPages(items); return items;
  }
  async function loadVersions() {
    if (!selected) return;
    const response = await fetch("/api/v1/admin/pages/" + selected + "/versions", { cache: "no-store" });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || "Could not load version history.");
    setVersions(result.data as VersionItem[]);
  }
  useEffect(() => { loadPages().then((items)=>{if(items[0]) selectPage(items[0]);}).catch((e:unknown)=>setError(e instanceof Error?e.message:"Could not load pages.")); }, []);
  function changeContent(next: Content) { setHistory((items)=>[...items,content].slice(-30)); setFuture([]); setContent(next); }
  function patchBlock(index:number,patch:Record<string,unknown>) {
    changeContent({...content,blocks:content.blocks.map((block,i)=>i===index?{...block,...patch}:block)});
  }
  async function createPage(event:FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!canCreate || !newTitle.trim() || !newSlug.trim()) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response=await fetch("/api/v1/admin/pages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({title:newTitle.trim(),slug:newSlug.trim(),draftContent:emptyContent})});
      const result=await response.json(); if(!response.ok) throw new Error(result.error||"Could not create page.");
      const items=await loadPages(); const created=items.find((item)=>item.id===result.data.id);
      if(created) selectPage(created);
      setNewTitle("");setNewSlug("");setMessage("Draft page created.");
    } catch(e) {setError(e instanceof Error?e.message:"Could not create page.");}
    finally {setBusy(false);}
  }
  async function save() {
    if(!selected||!canEdit) return;
    setBusy(true);setError("");setMessage("");
    try {
      const response=await fetch("/api/v1/admin/pages/"+selected,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,slug,draftContent:content})});
      const result=await response.json();if(!response.ok) throw new Error(result.error||"Could not save draft.");
      const items=await loadPages();const updated=items.find((item)=>item.id===selected);if(updated)selectPage(updated);
      setMessage("Draft saved. It is not public until published.");
    } catch(e) {setError(e instanceof Error?e.message:"Could not save draft.");}
    finally {setBusy(false);}
  }
  async function publish(unpublish=false) {
    if(!selected||!canPublish) return;
    if(!window.confirm(unpublish?"Unpublish this page? It will no longer be publicly accessible.":"Publish the saved page version to the public website?"))return;
    setBusy(true);setError("");setMessage("");
    try {
      if(!unpublish&&canEdit) {
        const saved=await fetch("/api/v1/admin/pages/"+selected,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify({title,slug,draftContent:content})});
        const saveResult=await saved.json();if(!saved.ok)throw new Error(saveResult.error||"Save failed.");
      }
      const response=await fetch("/api/v1/admin/pages/"+selected+(unpublish?"/unpublish":"/publish"),{method:"POST"});
      const result=await response.json();if(!response.ok)throw new Error(result.error||"Publishing failed.");
      const items=await loadPages();const updated=items.find((item)=>item.id===selected);if(updated)selectPage(updated);
      setMessage(unpublish?"Page unpublished.":"Page published successfully.");
    } catch(e) {setError(e instanceof Error?e.message:"Publishing failed.");}
    finally {setBusy(false);}
  }
  function moveBlock(from:number,to:number) {
    if(to<0||to>=content.blocks.length||from===to)return;
    const next=[...content.blocks];const [item]=next.splice(from,1);next.splice(to,0,item);changeContent({...content,blocks:next});
  }
  async function deletePage() {
    if(!selected||!canDelete||!window.confirm("Delete this unpublished page and its version history?"))return;
    setBusy(true);setError("");setMessage("");
    try {
      const response=await fetch("/api/v1/admin/pages/"+selected,{method:"DELETE"});
      if(!response.ok){const result=await response.json();throw new Error(result.error||"Could not delete page.");}
      const items=await loadPages();setSelected("");setTitle("");setSlug("");setContent(emptyContent);
      if(items[0])selectPage(items[0]);setMessage("Page deleted.");
    }catch(e){setError(e instanceof Error?e.message:"Could not delete page.");}
    finally{setBusy(false);}
  }
  async function restoreVersion(versionId:string) {
    if (!selected || !canEdit || !window.confirm("Restore this snapshot as a new draft? The live page remains unchanged until republished.")) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response=await fetch("/api/v1/admin/pages/"+selected+"/versions/"+versionId+"/restore",{method:"POST"});
      const result=await response.json(); if(!response.ok) throw new Error(result.error||"Could not restore version.");
      const items=await loadPages(); const updated=items.find((item)=>item.id===selected); if(updated) selectPage(updated);
      setShowVersions(true); await loadVersions(); setMessage("Version restored into a new draft revision. The live page was not changed.");
    } catch(e) { setError(e instanceof Error?e.message:"Could not restore version."); }
    finally { setBusy(false); }
  }
  const current=pages.find((page)=>page.id===selected);
  return <div className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-slate-500">Content management</p><h1 className="text-2xl font-bold text-ink">Visual page builder</h1></div><span className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-600">Role: {role.replaceAll("_"," ")}</span></div>
    {message?<p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{message}</p>:null}
    {error?<p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>:null}
    <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="content-card h-fit !p-4"><h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">Pages</h2>
        {canCreate?<form onSubmit={createPage} className="mb-4 space-y-2 rounded-xl bg-paper p-3"><label className="block text-xs font-bold" htmlFor="new-title">New page title</label><input id="new-title" className="form-field" placeholder="About the School" value={newTitle} onChange={(e)=>{setNewTitle(e.target.value);setNewSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,""));}} maxLength={160} required/><label className="block text-xs font-bold" htmlFor="new-slug">URL slug</label><input id="new-slug" className="form-field" placeholder="about-the-school" value={newSlug} onChange={(e)=>setNewSlug(e.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" required/><button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal px-3 py-2 text-sm font-bold text-white"><FilePlus2 size={15}/>Create draft</button></form>:null}
        <div className="space-y-2">{pages.map((page)=><button key={page.id} onClick={()=>selectPage(page)} className={"w-full rounded-xl border p-3 text-left "+(page.id===selected?"border-teal bg-teal/5":"border-slate-200 hover:bg-slate-50")}><span className="block font-semibold">{page.title}</span><span className="mt-1 block text-xs text-slate-500">/{page.slug}</span><span className={"mt-2 inline-block rounded-full px-2 py-1 text-[10px] font-bold uppercase "+(page.status==="published"?"bg-emerald-100 text-emerald-800":"bg-amber-100 text-amber-800")}>{page.status}</span></button>)}
        {!pages.length?<p className="rounded-lg bg-slate-50 p-3 text-sm leading-6 text-slate-500">No pages yet. Create a draft to start building the site.</p>:null}</div>
      </aside>
      <section className="min-w-0 space-y-4">
        {current?<><div className="content-card space-y-4 !p-5">
          <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-wider text-teal">Page settings</p><h2 className="mt-1 text-lg font-bold">{title||"Untitled page"}</h2></div><div className="flex flex-wrap gap-2">
            <button title="Undo" aria-label="Undo" disabled={!history.length||!canEdit} onClick={()=>{const previous=history[history.length-1];setHistory(history.slice(0,-1));setFuture([content,...future]);setContent(previous);}} className="rounded-lg border p-2 disabled:opacity-30"><Undo2 size={16}/></button>
            <button title="Redo" aria-label="Redo" disabled={!future.length||!canEdit} onClick={()=>{const next=future[0];setFuture(future.slice(1));setHistory([...history,content]);setContent(next);}} className="rounded-lg border p-2 disabled:opacity-30"><Redo2 size={16}/></button>
            <button onClick={()=>setPreview(!preview)} className="rounded-lg border px-3 py-2 text-sm font-semibold">{preview?"Edit blocks":"Preview"}</button>
            <button onClick={async()=>{const next=!showVersions;setShowVersions(next);if(next)try{await loadVersions();}catch(e){setError(e instanceof Error?e.message:"Could not load version history.");}}} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold"><History size={15}/>Versions</button>
            {canEdit?<button onClick={save} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-ink px-3 py-2 text-sm font-semibold text-white"><Save size={15}/>Save draft</button>:null}
            {canDelete&&current.status!=="published"?<button onClick={deletePage} disabled={busy} className="rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">Delete</button>:null}
            {canPublish&&current.status==="published"?<button onClick={()=>publish(true)} disabled={busy} className="rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-800">Unpublish</button>:null}
            {canPublish?<button onClick={()=>publish(false)} disabled={busy} className="inline-flex items-center gap-2 rounded-lg bg-teal px-3 py-2 text-sm font-semibold text-white"><Send size={15}/>Publish</button>:null}
          </div></div>
          <div className="grid gap-3 md:grid-cols-2"><label className="text-sm font-semibold">Page title<input className="form-field mt-1.5 font-normal" value={title} onChange={(e)=>setTitle(e.target.value)} maxLength={160} disabled={!canEdit}/></label><label className="text-sm font-semibold">URL slug<input className="form-field mt-1.5 font-normal" value={slug} onChange={(e)=>setSlug(e.target.value)} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxLength={180} disabled={!canEdit}/></label></div>
          <div className="grid gap-3 md:grid-cols-2"><label className="text-sm font-semibold">SEO title<input className="form-field mt-1.5 font-normal" maxLength={70} value={content.seo.title} onChange={(e)=>changeContent({...content,seo:{...content.seo,title:e.target.value}})} disabled={!canEdit}/></label><label className="text-sm font-semibold">SEO description<input className="form-field mt-1.5 font-normal" maxLength={180} value={content.seo.description} onChange={(e)=>changeContent({...content,seo:{...content.seo,description:e.target.value}})} disabled={!canEdit}/></label></div>
          <p className="text-xs text-slate-500">Revision {current.versionNumber}. Draft updates remain private until a version is published.</p>
        </div>
        {showVersions?<div className="content-card space-y-3 !p-5"><div><h3 className="font-bold">Version history</h3><p className="mt-1 text-sm text-slate-500">Restoring creates a new draft and does not automatically change the public version.</p></div>{versions.map((version)=><div key={version.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3"><div><p className="font-semibold">Revision {version.versionNumber} · {version.title}</p><p className="mt-1 text-xs text-slate-500">/{version.slug} · {version.status} · {new Date(version.createdAt).toLocaleString()}</p></div><button disabled={!canEdit||busy} onClick={()=>restoreVersion(version.id)} className="rounded-lg border px-3 py-2 text-sm font-semibold disabled:opacity-40">Restore as draft</button></div>)}{!versions.length?<p className="text-sm text-slate-500">No versions found.</p>:null}</div>:null}
        {!preview?<div className="grid gap-5 lg:grid-cols-[210px_minmax(0,1fr)]">
          <aside className="content-card h-fit !p-4"><h3 className="mb-3 text-sm font-bold">Block library</h3>{(["hero","richText","cta"] as const).map((type)=><button key={type} disabled={!canEdit} onClick={()=>changeContent({...content,blocks:[...content.blocks,makeBlock(type)]})} className="mb-2 flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold hover:border-teal disabled:opacity-40"><span>{type==="richText"?"Text section":type==="hero"?"Hero banner":"Call to action"}</span><Plus size={15}/></button>)}<p className="mt-3 text-xs leading-5 text-slate-500">Content is validated against an allowlisted block registry. Arbitrary HTML and scripts are never executed.</p></aside>
          <div className="min-w-0 space-y-3">
            {content.blocks.map((block,index)=><div key={block.id} draggable={canEdit} onDragStart={()=>{dragIndex.current=index;}} onDragOver={(e)=>e.preventDefault()} onDrop={()=>{if(dragIndex.current!==null&&canEdit)moveBlock(dragIndex.current,index);dragIndex.current=null;}} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-500"><GripVertical size={15}/>{block.type==="richText"?"Text section":block.type==="hero"?"Hero banner":block.type==="cta"?"Call to action":block.type} · {index+1}</div><div className="flex gap-1">
                <button title="Move up" disabled={!canEdit} onClick={()=>moveBlock(index,index-1)} className="rounded border p-1.5 disabled:opacity-30"><ArrowUp size={14}/></button><button title="Move down" disabled={!canEdit} onClick={()=>moveBlock(index,index+1)} className="rounded border p-1.5 disabled:opacity-30"><ArrowDown size={14}/></button><button title="Duplicate" disabled={!canEdit} onClick={()=>{const clone={...block,id:blockId()};const next=[...content.blocks];next.splice(index+1,0,clone);changeContent({...content,blocks:next});}} className="rounded border p-1.5 disabled:opacity-30"><Copy size={14}/></button><button title={block.visible?"Hide":"Show"} disabled={!canEdit} onClick={()=>patchBlock(index,{visible:!block.visible})} className="rounded border p-1.5 disabled:opacity-30">{block.visible?<Eye size={14}/>:<EyeOff size={14}/>}</button><button title="Delete block" disabled={!canEdit} onClick={()=>{if(window.confirm("Delete this section?"))changeContent({...content,blocks:content.blocks.filter((_,i)=>i!==index)});}} className="rounded border border-red-200 p-1.5 text-red-600 disabled:opacity-30"><Trash2 size={14}/></button></div></div>
              {block.type==="hero"?<div className="grid gap-3 md:grid-cols-2"><label className="text-sm font-medium">Eyebrow<input disabled={!canEdit} className="form-field mt-1" value={String(block.eyebrow||"")} onChange={(e)=>patchBlock(index,{eyebrow:e.target.value})}/></label><label className="text-sm font-medium">Heading<input disabled={!canEdit} className="form-field mt-1" value={String(block.title||"")} onChange={(e)=>patchBlock(index,{title:e.target.value})}/></label><label className="text-sm font-medium md:col-span-2">Subtitle<textarea disabled={!canEdit} className="form-field mt-1" rows={2} value={String(block.subtitle||"")} onChange={(e)=>patchBlock(index,{subtitle:e.target.value})}/></label><label className="text-sm font-medium">Button label<input disabled={!canEdit} className="form-field mt-1" value={String(block.buttonLabel||"")} onChange={(e)=>patchBlock(index,{buttonLabel:e.target.value})}/></label><label className="text-sm font-medium">Button URL<input disabled={!canEdit} className="form-field mt-1" value={String(block.buttonHref||"")} onChange={(e)=>patchBlock(index,{buttonHref:e.target.value})}/></label></div>
              :block.type==="cta"?<div className="grid gap-3 md:grid-cols-2"><label className="text-sm font-medium">Heading<input disabled={!canEdit} className="form-field mt-1" value={String(block.title||"")} onChange={(e)=>patchBlock(index,{title:e.target.value})}/></label><label className="text-sm font-medium">Button label<input disabled={!canEdit} className="form-field mt-1" value={String(block.buttonLabel||"")} onChange={(e)=>patchBlock(index,{buttonLabel:e.target.value})}/></label><label className="text-sm font-medium md:col-span-2">Body<textarea disabled={!canEdit} className="form-field mt-1" rows={3} value={String(block.body||"")} onChange={(e)=>patchBlock(index,{body:e.target.value})}/></label><label className="text-sm font-medium md:col-span-2">Button URL<input disabled={!canEdit} className="form-field mt-1" value={String(block.buttonHref||"")} onChange={(e)=>patchBlock(index,{buttonHref:e.target.value})}/></label></div>
              :block.type==="richText"?<div className="grid gap-3"><label className="text-sm font-medium">Heading<input disabled={!canEdit} className="form-field mt-1" value={String(block.title||"")} onChange={(e)=>patchBlock(index,{title:e.target.value})}/></label><label className="text-sm font-medium">Text<textarea disabled={!canEdit} className="form-field mt-1" rows={4} value={String(block.body||"")} onChange={(e)=>patchBlock(index,{body:e.target.value})}/></label></div>
              :<p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This block type remains intact and renders publicly, but its detailed inspector is not available yet.</p>}
            </div>)}
            {!content.blocks.length?<div className="rounded-2xl border-2 border-dashed border-slate-300 px-6 py-12 text-center"><p className="font-semibold">Start with a content block</p><p className="mt-1 text-sm text-slate-500">Add a hero, text section or call to action from the block library.</p></div>:null}
          </div>
        </div>:<div className="content-card !p-4"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">Responsive preview</h3><div className="flex gap-2"><button aria-label="Desktop preview" onClick={()=>setViewport("desktop")} className={"rounded border p-2 "+(viewport==="desktop"?"border-teal bg-teal/10":"")}><Monitor size={16}/></button><button aria-label="Tablet preview" onClick={()=>setViewport("tablet")} className={"rounded border p-2 "+(viewport==="tablet"?"border-teal bg-teal/10":"")}><Tablet size={16}/></button><button aria-label="Mobile preview" onClick={()=>setViewport("mobile")} className={"rounded border p-2 "+(viewport==="mobile"?"border-teal bg-teal/10":"")}><Smartphone size={16}/></button></div></div><div className={"mx-auto space-y-4 rounded-xl bg-paper p-4 "+(viewport==="desktop"?"max-w-full":viewport==="tablet"?"max-w-2xl":"max-w-sm")}>{content.blocks.map((block)=><PreviewBlock key={block.id} block={block}/>)}</div></div>}
      </>:<div className="content-card py-16 text-center"><h2 className="text-lg font-bold">Select or create a page</h2><p className="mt-2 text-sm text-slate-500">Pages remain private drafts until a publisher publishes them.</p></div>}
      </section>
    </div>
  </div>;
}