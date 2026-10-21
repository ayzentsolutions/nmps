import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import GalleryAlbum from "@/models/GalleryAlbum";
import {connectToDatabase} from "@/lib/mongodb";
import {getDefaultSchoolId} from "@/lib/school";
type Props={params:Promise<{slug:string}>};
export const dynamic="force-dynamic";
async function getAlbum(slug:string){if(!process.env.MONGODB_URI)return null;await connectToDatabase();return GalleryAlbum.findOne({schoolId:getDefaultSchoolId(),publishedSlug:slug,status:"published",publishedItems:{$ne:null}}).lean();}
export async function generateMetadata({params}:Props):Promise<Metadata>{const {slug}=await params;const album=await getAlbum(slug);return {title:album?.publishedTitle||"Photo gallery",description:album?.publishedDescription||"Published school photo album.",robots:{index:Boolean(album),follow:true}};}
export default async function GalleryAlbumPage({params}:Props){const {slug}=await params;const album=await getAlbum(slug);if(!album)notFound();const photos=[...(album.publishedItems||[])].sort((a,b)=>a.order-b.order);
 return <main className="min-h-screen bg-paper"><header className="border-b border-slate-200 bg-white"><div className="container-site flex min-h-[76px] items-center justify-between"><Link href="/" className="font-bold">School Website</Link><Link href="/gallery" className="text-sm font-semibold text-teal">All albums</Link></div></header><section className="bg-ink py-14 text-white"><div className="container-site"><p className="eyebrow !text-gold">Photo album</p><h1 className="mt-3 text-4xl font-bold">{album.publishedTitle}</h1><p className="mt-4 max-w-3xl whitespace-pre-wrap leading-7 text-slate-200">{album.publishedDescription}</p></div></section><section className="container-site py-10"><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{photos.map((photo)=><figure key={photo.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><img src={photo.imageUrl} alt={photo.altText} loading="lazy" className="aspect-[4/3] w-full object-cover"/>{photo.caption?<figcaption className="p-3 text-sm text-slate-600">{photo.caption}</figcaption>:null}</figure>)}</div></section></main>;
}