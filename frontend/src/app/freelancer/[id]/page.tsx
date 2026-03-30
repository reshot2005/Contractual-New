import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { MapPin, Calendar, Star, Linkedin, Github, Globe, CheckCircle2, FolderOpen } from "lucide-react"
import { format } from "date-fns"
import { formatCurrency } from "@/lib/currency"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Image from "next/image"

export const revalidate = 120

export default async function FreelancerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await prisma.user.findUnique({
    where: { id },
    include: {
      skills: true,
      portfolio: true,
      experience: { orderBy: { startYear: 'desc' } },
      education: { orderBy: { startYear: 'desc' } },
      languages: true,
      _count: {
        select: {
          reviewsReceived: true,
          contractsAsFreelancer: true
        }
      }
    }
  })

  // Increment profile views
  if (p) {
    void prisma.user.update({
      where: { id },
      data: { profileViews: { increment: 1 } }
    })
  }

  if (!p) return notFound()

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <section className="bg-white border-b border-gray-100 relative">
        <div className="h-48 md:h-72 w-full relative overflow-hidden">
           {p.coverImage ? (
             <Image 
               src={p.coverImage} 
               fill 
               alt={`${p.name}'s Banner`}
               className="object-cover transition-transform duration-700 hover:scale-105" 
               priority 
               sizes="100vw" 
             />
           ) : (
             <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#2d7a7e] shadow-[inset_0_-80px_60px_-40px_rgba(0,0,0,0.4)]" />
           )}
           <div className="absolute inset-0 bg-black/10" />
           <div className="absolute bottom-0 left-0 w-full h-1.5 bg-teal-500/80 backdrop-blur-sm" />
        </div>
        
        <div className="max-w-6xl mx-auto px-6 lg:px-12 relative z-10 pb-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="-mt-20 shrink-0 flex flex-col items-center lg:items-start group">
              <div className="relative w-40 h-40 rounded-3xl bg-white p-2 shadow-xl">
                {p.image ? (
                  <Image src={p.image} width={160} height={160} alt={p.name} className="w-full h-full rounded-2xl object-cover bg-gray-100" />
                ) : (
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center text-white text-5xl font-black">
                    {p.name?.charAt(0) || "F"}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 mt-6 lg:mt-24">
              <div className="flex justify-between items-start">
                <div>
                   <h1 className="text-3xl font-black font-josefin text-[#0f172a]">{p.name}</h1>
                   <p className="text-lg font-bold text-teal-600 uppercase tracking-tight mt-1">{p.headline || "Professional Freelancer"}</p>

                   <div className="flex flex-wrap items-center gap-4 mt-4 text-[13px] font-bold text-[#64748b]">
                     <div className="flex items-center gap-1.5"><MapPin size={14} className="text-gray-400" /> {p.location || "Earth"}</div>
                     <div className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" /> Member since {format(new Date(p.createdAt), "MMMM yyyy")}</div>
                     {p.isAvailable && (
                       <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Available for work
                       </div>
                     )}
                   </div>
                </div>

                <div className="hidden sm:flex items-center gap-3">
                  <Button className="h-11 px-8 rounded-xl font-bold gap-2 bg-teal-600 hover:bg-teal-700">Hire {p.name.split(' ')[0]}</Button>
                  <Button variant="outline" className="h-11 px-5 rounded-xl border-gray-200 text-[#0f172a] font-bold">Message</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 lg:px-12 py-10 w-full">
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1 space-y-8">
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
               <h3 className="font-black text-[#0f172a] uppercase tracking-widest text-sm mb-6">About Me</h3>
               <p className="text-[#374151] leading-relaxed whitespace-pre-wrap text-sm font-medium">{p.bio || "No bio provided."}</p>
            </div>

            {p.skills.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                <h3 className="font-black text-[#0f172a] uppercase tracking-widest text-sm mb-6">Skills & Expertise</h3>
                <div className="flex flex-wrap gap-2">
                  {p.skills.map(skill => (
                    <div key={skill.id} className="flex items-center gap-2 bg-[#e8f4f5] text-[#2d7a7e] border border-[#b0d4d6] px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                      {skill.name}
                      <span className="text-[9px] font-black uppercase bg-teal-600 text-white px-1.5 py-0.5 rounded-full">{skill.level || "Expert"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {p.portfolio.length > 0 && (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                 <h3 className="font-black text-[#0f172a] uppercase tracking-widest text-sm mb-6">Portfolio</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {p.portfolio.map(item => (
                    <div key={item.id} className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 relative group cursor-pointer shadow-sm">
                      {item.imageUrl ? <Image src={item.imageUrl} fill alt={item.title} className="object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300"><FolderOpen size={32} /></div>}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
                        <p className="text-white font-bold text-sm mb-4 leading-tight">{item.title}</p>
                        {item.url && <a href={item.url.startsWith("http") ? item.url : `https://${item.url}`} target="_blank" rel="noreferrer" className="h-8 rounded-full border border-white text-white text-[11px] font-black uppercase px-4 flex items-center hover:bg-white hover:text-black transition-colors">Open Project -&gt;</a>}
                      </div>
                      {item.url && <a href={item.url.startsWith("http") ? item.url : `https://${item.url}`} target="_blank" rel="noreferrer" className="absolute inset-0 z-10" aria-label={`Open ${item.title}`} />}
                    </div>
                  ))}
                 </div>
              </div>
            )}

            {(p.experience.length > 0 || p.education.length > 0) && (
              <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
                 <h3 className="font-black text-[#0f172a] uppercase tracking-widest text-sm mb-6">Experience & Education</h3>
                 <div className="relative pl-8 border-l-2 border-teal-100 space-y-8">
                   {p.experience.map(exp => (
                     <div key={exp.id} className="relative">
                       <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-white border-4 border-teal-500 shadow-sm" />
                       <div className="bg-[#f8fafc] rounded-2xl p-6 border border-gray-100">
                         <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-black uppercase tracking-widest">Experience</span>
                         <h4 className="text-lg font-black text-[#0f172a] mt-2">{exp.title}</h4>
                         <p className="text-sm font-bold text-[#64748b]">{exp.company} • {exp.startYear} — {exp.endYear || "Present"}</p>
                         {exp.description && <p className="mt-3 text-xs font-medium text-gray-500 leading-relaxed">{exp.description}</p>}
                       </div>
                     </div>
                   ))}
                   {p.education.map(edu => (
                     <div key={edu.id} className="relative">
                       <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-white border-4 border-teal-500 shadow-sm" />
                       <div className="bg-[#f8fafc] rounded-2xl p-6 border border-gray-100">
                         <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest">Education</span>
                         <h4 className="text-lg font-black text-[#0f172a] mt-2">{edu.degree}</h4>
                         <p className="text-sm font-bold text-[#64748b]">{edu.institution} • {edu.startYear} — {edu.endYear || "Ongoing"}</p>
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>

          <div className="w-full lg:w-[320px] space-y-6">
             <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
               <div className="flex items-center gap-2 mb-6">
                 <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-xs font-black uppercase tracking-widest text-green-700">{p.isAvailable ? "Available Now" : "Currently Busy"}</span>
               </div>
               
               <div className="space-y-4">
                 <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                   <span className="text-[11px] font-bold text-gray-400 uppercase">Hourly Rate</span>
                   <span className="text-sm font-black text-[#0f172a]">₹{p.hourlyRate || 0}/hr</span>
                 </div>
                 <div className="flex justify-between items-center pb-4 border-b border-gray-50">
                   <span className="text-[11px] font-bold text-gray-400 uppercase">Per Week</span>
                   <span className="text-sm font-black text-[#0f172a]">{p.availability || "30 hrs"}</span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-[11px] font-bold text-gray-400 uppercase">Languages</span>
                   <span className="text-sm font-black text-[#0f172a]">{p.languages.map(l => l.name).join(", ") || "English"}</span>
                 </div>
               </div>

               <Button className="w-full mt-6 bg-slate-900 hover:bg-slate-800 h-12 rounded-xl font-bold">Hire {p.name.split(" ")[0]}</Button>
             </div>

             <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
               <h3 className="font-black text-[#0f172a] uppercase tracking-widest text-xs mb-4">Social Links</h3>
               <div className="space-y-3">
                 {(p as any).linkedinUrl && (
                   <a href={(p as any).linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-2xl border border-gray-50 hover:border-[#0077b5] group transition-colors">
                     <div className="w-8 h-8 rounded-lg bg-[#0077b5]/10 flex items-center justify-center text-[#0077b5]"><Linkedin size={14} /></div>
                     <span className="text-xs font-bold text-gray-600 group-hover:text-[#0077b5]">LinkedIn</span>
                   </a>
                 )}
                 {(p as any).githubUrl && (
                   <a href={(p as any).githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-2xl border border-gray-50 hover:border-black group transition-colors">
                     <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-black"><Github size={14} /></div>
                     <span className="text-xs font-bold text-gray-600 group-hover:text-black">GitHub</span>
                   </a>
                 )}
                 {(p as any).websiteUrl && (
                   <a href={(p as any).websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-2xl border border-gray-50 hover:border-teal-600 group transition-colors">
                     <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600"><Globe size={14} /></div>
                     <span className="text-xs font-bold text-gray-600 group-hover:text-teal-600">Website</span>
                   </a>
                 )}
               </div>
             </div>
          </div>
          
        </div>
      </main>
    </div>
  )
}
