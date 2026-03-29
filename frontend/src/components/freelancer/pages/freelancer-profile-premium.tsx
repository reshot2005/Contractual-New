"use client"

import { useState, useMemo, useEffect, useCallback, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Pencil,
  MapPin,
  Calendar,
  Share2,
  Eye,
  Star,
  Clock,
  Briefcase,
  Users,
  Image as ImageIcon,
  Plus,
  Trash2,
  ExternalLink,
  Award,
  CheckCircle2,
  Info,
  ChevronDown,
  Lightbulb,
  Linkedin,
  Github,
  Globe,
  MoreVertical,
  Camera,
  FolderOpen,
  Award as TrophyIcon,
  Check,
  Loader2,
  AlertCircle
} from "lucide-react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { qk } from "@/lib/realtime/query-keys"
import { format } from "date-fns"
import Link from "next/link"
import Image from "next/image"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { formatCurrency } from "@/lib/currency"
import { UploadButton } from "@/lib/uploadthing-react"
import { AddSkillModal, AddPortfolioModal, AddExperienceModal, AddEducationModal, SkillRemoveButton, ExperienceDeleteButton, EducationDeleteButton } from "./profile-modals"

/* ------------------- Types ------------------- */

type Profile = {
  id: string
  name: string
  image: string | null
  coverImage: string | null
  headline: string | null
  bio: string | null
  location: string | null
  hourlyRate: number | null
  availability: string | null
  isAvailable?: boolean
  profileComplete?: number
  profileViews?: number
  linkedinUrl?: string | null
  githubUrl?: string | null
  websiteUrl?: string | null
  createdAt: string
  skills: { id: string; name: string; level?: string }[]
  portfolio: { id: string; title: string; imageUrl: string | null; url?: string }[]
  education: { id: string; institution: string; degree: string; startYear: number; endYear: number | null; description?: string }[]
  experience: { id: string; title: string; company: string; startYear: number; endYear: number | null; current: boolean; description?: string }[]
  certifications: { id: string; name: string; issuer: string; year: number | null; url?: string }[]
  languages: { id: string; name: string; proficiency: string }[]
  reviewsReceived?: any[]
  reviewCount?: number
  completedContracts?: number
  activeContracts?: number
  avgRating?: number
  _count?: { contractsAsFreelancer: number; applications: number }
}

/* ------------------- Client-side Completeness ------------------- */

function computeCompletenessLocal(p: Profile): number {
  let score = 0
  if (p.image) score += 15
  if (p.headline && p.headline.trim().length > 0) score += 10
  if (p.bio && p.bio.trim().length >= 50) score += 15
  if ((p.skills?.length ?? 0) >= 3) score += 15
  if (p.hourlyRate && p.hourlyRate > 0) score += 10
  if ((p.portfolio?.length ?? 0) >= 1) score += 15
  if ((p.education?.length ?? 0) >= 1) score += 10
  if ((p.languages?.length ?? 0) >= 1) score += 5
  return Math.min(100, score)
}

/* ------------------- Save Status ------------------- */
type SaveStatus = "idle" | "saving" | "saved" | "error"

function useSaveIndicator() {
  const [status, setStatus] = useState<SaveStatus>("idle")
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const markSaving = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setStatus("saving")
  }, [])

  const markSaved = useCallback(() => {
    setStatus("saved")
    timeoutRef.current = setTimeout(() => setStatus("idle"), 2000)
  }, [])

  const markError = useCallback(() => {
    setStatus("error")
    timeoutRef.current = setTimeout(() => setStatus("idle"), 4000)
  }, [])

  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }, [])

  return { status, markSaving, markSaved, markError }
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  return (
    <AnimatePresence>
      {status !== "idle" && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 backdrop-blur-lg border border-gray-200/50 shadow-lg"
        >
          {status === "saving" && (
            <>
              <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Saving...</span>
            </>
          )}
          {status === "saved" && (
            <>
              <Check size={12} className="text-teal-500" />
              <span className="text-[11px] font-bold text-teal-600 uppercase tracking-widest">✓ Saved</span>
            </>
          )}
          {status === "error" && (
            <>
              <AlertCircle size={12} className="text-red-500" />
              <span className="text-[11px] font-bold text-red-500 uppercase tracking-widest">Not saved</span>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------- Debounced Batch Save Hook ------------------- */

function useDebouncedPatch(qc: ReturnType<typeof useQueryClient>, save: ReturnType<typeof useSaveIndicator>) {
  const pendingRef = useRef<Record<string, any>>({})
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const flush = useCallback(async () => {
    const data = { ...pendingRef.current }
    pendingRef.current = {}
    if (Object.keys(data).length === 0) return
    
    save.markSaving()
    try {
      const res = await fetch("/api/freelancer/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Save failed")
      save.markSaved()
      qc.invalidateQueries({ queryKey: qk.freelancerProfile() })
    } catch {
      save.markError()
      toast.error("Changes could not be saved. Retrying...")
      // Re-queue the failed data
      pendingRef.current = { ...data, ...pendingRef.current }
    }
  }, [qc, save])

  const queuePatch = useCallback((fields: Record<string, any>) => {
    // Optimistic: immediately update cache
    qc.setQueryData(qk.freelancerProfile(), (old: Profile | undefined) => {
      if (!old) return old
      return { ...old, ...fields }
    })

    // Queue for batched save
    pendingRef.current = { ...pendingRef.current, ...fields }
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(flush, 200)
  }, [qc, flush])

  // Flush on unmount
  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    flush()
  }, [flush])

  return queuePatch
}

/* ------------------- Main Component ------------------- */

export function FreelancerProfilePremium({ initialData }: { initialData?: Profile }) {
  const qc = useQueryClient()
  const [editMode, setEditMode] = useState<string | null>(null)
  const [showSkills, setShowSkills] = useState(false)
  const [showPortfolio, setShowPortfolio] = useState(false)
  const [showExperience, setShowExperience] = useState(false)
  const [showEducation, setShowEducation] = useState(false)

  const save = useSaveIndicator()

  const { data: p } = useQuery<Profile>({
    queryKey: qk.freelancerProfile(),
    queryFn: async () => {
      const res = await fetch("/api/freelancer/profile")
      const j = await res.json()
      if (!res.ok) throw new Error(j.error || "Failed")
      return j.data
    },
    initialData,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  const queuePatch = useDebouncedPatch(qc, save)

  // Client-side completeness — recalculates instantly on every change
  const completeness = useMemo(() => p ? computeCompletenessLocal(p) : 0, [p])

  // Auto-save wrapper for blur
  const handleBlurSave = (field: string, value: any) => {
    if (p && (p as any)[field] !== value) {
      queuePatch({ [field]: value })
    }
    setEditMode(null)
  }

  if (!p) return (
    <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 animate-pulse" />
        <div className="h-3 w-40 bg-gray-200 rounded-full animate-pulse" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-20 font-plus-jakarta">

      {/* Google Docs-style save indicator */}
      <SaveIndicator status={save.status} />

      {/* PROFILE HERO SECTION */}
      <section className="relative w-full bg-white border-b border-gray-200">
        <div className="h-[240px] w-full relative group overflow-hidden bg-gradient-to-br from-[#0f172a] via-[#0f3460] to-[#2d7a7e]">
          {p.coverImage && <Image src={p.coverImage} fill alt="Cover" className="object-cover" />}
          <div className="absolute inset-0 bg-black/10 transition-opacity group-hover:bg-black/20" />

          <div className="absolute top-6 right-6">
            <UploadButton
              endpoint="portfolioFiles"
              className="ut-button:h-9 ut-button:px-4 ut-button:bg-white/10 ut-button:backdrop-blur-md ut-button:border-white/20 ut-button:text-white ut-button:text-xs ut-button:font-bold ut-button:hover:bg-white/20"
              onClientUploadComplete={(res) => {
                if (res?.[0]) queuePatch({ coverImage: res[0].url })
              }}
            />
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 lg:px-12 relative">
          <div className="flex flex-col lg:flex-row gap-8 items-start -mt-20 pb-10">

            {/* Left - Avatar & Core Info */}
            <div className="relative group w-40 h-40 shrink-0">
              <div className="w-full h-full rounded-full border-[6px] border-white overflow-hidden bg-gray-100 shadow-xl">
                {p.image ? <Image src={p.image} fill alt="Avatar" className="object-cover" /> : <div className="w-full h-full flex items-center justify-center text-3xl font-black bg-teal-100 text-teal-700">{p.name.slice(0, 1)}</div>}
              </div>
              <div className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <Camera className="text-white w-8 h-8" />
                <UploadButton
                  endpoint="avatars"
                  className="absolute inset-0 opacity-0"
                  onClientUploadComplete={(res) => { if (res?.[0]) queuePatch({ image: res[0].url }) }}
                />
              </div>
            </div>

            <div className="flex-1 mt-6 lg:mt-24">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-black font-josefin text-[#0f172a]">{p.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    {editMode === 'headline' ? (
                      <input
                        autoFocus
                        className="text-lg font-bold text-teal-600 outline-none border-b border-teal-500 bg-transparent w-full"
                        defaultValue={p.headline || ""}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleBlurSave('headline', e.currentTarget.value);
                          if (e.key === 'Escape') setEditMode(null);
                        }}
                        onBlur={(e) => handleBlurSave('headline', e.target.value)}
                      />
                    ) : (
                      <>
                        <p className="text-lg font-bold text-teal-600 uppercase tracking-tight">{p.headline || "Add a Professional Headline"}</p>
                        <button onClick={() => setEditMode('headline')} className="text-gray-300 hover:text-teal-500"><Pencil size={14} /></button>
                      </>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mt-4 text-[13px] font-bold text-[#64748b]">
                    <div className="flex items-center gap-1.5 ">
                      <MapPin size={14} className="text-gray-400" /> 
                      <EditableText 
                        value={p.location || "Add Location"} 
                        onSave={(val) => queuePatch({ location: val })} 
                        className="text-[13px] font-bold text-[#64748b]"
                      />
                    </div>
                    <div className="flex items-center gap-1.5"><Calendar size={14} className="text-gray-400" /> Member since {format(new Date(p.createdAt || new Date()), "MMMM yyyy")}</div>
                    {p.isAvailable && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Available for work
                      </div>
                    )}
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-3">
                  <Button 
                    variant="outline" 
                    className="h-10 px-5 rounded-xl border-gray-200 text-[#0f172a] font-bold gap-2"
                    onClick={() => {
                      const url = `${window.location.origin}/freelancer/${p.id}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Profile link copied to clipboard!");
                    }}
                  >
                    <Share2 size={16} /> Share
                  </Button>
                  <Link href={`/freelancer/${p.id}`} className="h-10 px-5 rounded-xl border border-gray-200 bg-white flex items-center justify-center font-bold gap-2 text-[#0f172a] hover:border-teal-500"><Eye size={16} /> Preview as Client</Link>
                </div>
              </div>
            </div>

            {/* Completeness Ring */}
            <div className="hidden lg:flex flex-col items-center gap-2 mt-24">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle className="text-gray-100" strokeWidth="8" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                  <circle
                    className="text-teal-500 transition-[stroke-dashoffset] duration-700 ease-out"
                    strokeWidth="8"
                    strokeDasharray={251}
                    strokeDashoffset={251 - (251 * completeness) / 100}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40" cx="50" cy="50"
                  />
                  <text x="50" y="48" textAnchor="middle" className="text-xl font-black fill-[#0f172a]">{completeness}%</text>
                  <text x="50" y="62" textAnchor="middle" className="text-[9px] font-black uppercase tracking-tighter fill-gray-400">Complete</text>
                </svg>
              </div>
              <p className="text-[11px] font-black text-teal-600 uppercase">Strong Profile</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS RIBBON */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 md:gap-0">
            <StatItem label="Rating" val={p.avgRating ? p.avgRating.toFixed(1) : "—"} sub={`(${p.reviewCount || p._count?.contractsAsFreelancer || 0} reviews)`} icon={<Star size={16} className="fill-amber-400 text-amber-400" />} />
            <StatItem label="Jobs Completed" val={(p.completedContracts || 0).toString()} sub="Verified Projects" divider />
            <StatItem label="Response Time" val="< 1hr" sub="Avg Response" divider />
            <StatItem label="Active Contracts" val={(p.activeContracts || 0).toString()} sub="In Progress" divider />
            <StatItem label="Profile Views" val={(p.profileViews || 0).toLocaleString()} sub="Lifetime" divider />
          </div>
        </div>
      </section>

      {/* MAIN BODY - TWO COLUMNS */}
      <main className="max-w-7xl mx-auto px-6 lg:px-12 py-10">
        <div className="flex flex-col lg:flex-row gap-8">

          {/* LEFT COLUMN - Major Sections */}
          <div className="flex-1 space-y-8">

            {/* ABOUT ME */}
            <Section elevation="white">
              <Header title="About Me" edit={() => setEditMode('bio')} />
              {editMode === 'bio' ? (
                <div className="space-y-4">
                  <textarea
                    autoFocus
                    id="bio-input"
                    className="w-full min-h-[160px] p-4 rounded-xl border border-teal-500 font-medium text-sm focus:ring-4 focus:ring-teal-50 outline-none"
                    defaultValue={p.bio || ""}
                  />
                  <div className="flex gap-3">
                    <Button className="bg-teal-600 hover:bg-teal-700 rounded-xl text-xs font-black uppercase" onClick={() => {
                      const el = document.getElementById('bio-input') as HTMLTextAreaElement
                      if (el) queuePatch({ bio: el.value })
                      setEditMode(null)
                    }}>Confirm & Save</Button>
                    <Button variant="outline" className="rounded-xl text-xs font-black uppercase" onClick={() => setEditMode(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 font-medium text-sm leading-relaxed whitespace-pre-wrap">{p.bio || "Tell clients about yourself, your expertise, and what makes you stand out."}</p>
              )}
            </Section>

            {/* SKILLS */}
            <Section elevation="white">
              <Header title="Skills & Expertise" action={<button onClick={() => setShowSkills(true)} className="text-teal-600 font-black text-[11px] uppercase hover:bg-teal-50 flex items-center"><Plus size={14} className="mr-1" /> Add Skill</button>} />
              <div className="flex flex-wrap gap-2 mt-4">
                {(p.skills || []).map(skill => (
                  <div key={skill.id} className="group relative flex items-center gap-2 bg-[#e8f4f5] text-[#2d7a7e] border border-[#b0d4d6] px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                    {skill.name}
                    <span className="text-[9px] font-black uppercase bg-teal-600 text-white px-1.5 py-0.5 rounded-full">{skill.level || "Expert"}</span>
                    <SkillRemoveButton id={skill.id} />
                  </div>
                ))}
              </div>
            </Section>

            <Section elevation="white">
              <Header title="Portfolio" action={<button onClick={() => setShowPortfolio(true)} className="text-teal-600 font-black text-[11px] uppercase hover:bg-teal-50 flex items-center"><Plus size={14} className="mr-1" /> Add Work</button>} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {(p.portfolio || []).map((item) => (
                  item.url ? (
                    <a
                      key={item.id}
                      href={item.url.startsWith("http") ? item.url : `https://${item.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 relative group cursor-pointer shadow-sm block"
                    >
                      {item.imageUrl ? <Image src={item.imageUrl} fill loading="lazy" alt="Portfolio item" className="object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300"><ImageIcon size={32} /></div>}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
                        <p className="text-white font-bold text-sm mb-4 leading-tight">{item.title}</p>
                        <span className="h-8 rounded-full border border-white text-white text-[11px] font-black uppercase px-4 flex items-center hover:bg-white hover:text-black transition-colors">
                          Open Project -&gt;
                        </span>
                      </div>
                    </a>
                  ) : (
                    <div key={item.id} className="aspect-[4/3] rounded-2xl overflow-hidden border border-gray-100 relative group cursor-pointer shadow-sm">
                      {item.imageUrl ? <Image src={item.imageUrl} fill loading="lazy" alt="Portfolio item" className="object-cover group-hover:scale-110 transition-transform duration-500" /> : <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-300"><ImageIcon size={32} /></div>}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center">
                        <p className="text-white font-bold text-sm mb-4 leading-tight">{item.title}</p>
                        <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">No Link Provided</span>
                      </div>
                    </div>
                  )
                ))}
                {(!p.portfolio || p.portfolio.length === 0) && (
                  <div className="col-span-full py-12 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center text-gray-400">
                    <FolderOpen size={48} className="mb-4 opacity-50" />
                    <p className="font-bold">Showcase your best work here</p>
                    <p className="text-gray-400 mt-2 text-xs">Click "Add Work" above to begin</p>
                  </div>
                )}
              </div>
            </Section>

            {/* EXPERIENCE & EDUCATION TIMELINE */}
            <Section elevation="white">
              <Header title="Experience & Education" action={
                <div className="flex gap-2">
                  <button onClick={() => setShowExperience(true)} className="text-teal-600 font-black text-[11px] uppercase hover:bg-teal-50 flex items-center"><Plus size={14} className="mr-1" /> Experience</button>
                  <button onClick={() => setShowEducation(true)} className="text-teal-600 font-black text-[11px] uppercase hover:bg-teal-50 flex items-center"><Plus size={14} className="mr-1" /> Education</button>
                </div>
              } />
              <div className="mt-8 relative pl-8 border-l-2 border-teal-100 space-y-10">
                {(p.experience || []).map(exp => (
                  <div key={exp.id} className="relative">
                    <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-white border-4 border-teal-500 shadow-sm" />
                    <div className="bg-[#f8fafc] rounded-2xl p-6 border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[10px] font-black uppercase tracking-widest">Experience</span>
                          <h4 className="text-lg font-black text-[#0f172a] mt-2">{exp.title}</h4>
                          <p className="text-sm font-bold text-[#64748b]">{exp.company} • {exp.startYear} — {exp.current ? "Present" : exp.endYear}</p>
                        </div>
                        <ExperienceDeleteButton id={exp.id} />
                      </div>
                    </div>
                  </div>
                ))}
                {(p.education || []).map(edu => (
                  <div key={edu.id} className="relative">
                    <div className="absolute -left-[41px] top-1 w-6 h-6 rounded-full bg-white border-4 border-teal-500 shadow-sm" />
                    <div className="bg-[#f8fafc] rounded-2xl p-6 border border-gray-100">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-widest">Education</span>
                          <h4 className="text-lg font-black text-[#0f172a] mt-2">{edu.degree}</h4>
                          <p className="text-sm font-bold text-[#64748b]">{edu.institution} • {edu.startYear} — {edu.endYear || "Ongoing"}</p>
                        </div>
                        <EducationDeleteButton id={edu.id} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

          </div>

          {/* RIGHT COLUMN - Fixed Sidebar */}
          <div className="w-full lg:w-[360px] space-y-6">

            {/* AVAILABILITY CARD */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="relative group/status-dropdown">
                  <select 
                    value={p.isAvailable ? (p.availability === "on_holiday" ? "away" : "available") : "busy"}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "available") queuePatch({ isAvailable: true, availability: "full_time" });
                      else if (val === "away") queuePatch({ isAvailable: true, availability: "on_holiday" });
                      else queuePatch({ isAvailable: false, availability: "busy" });
                    }}
                    className={cn(
                      "appearance-none cursor-pointer pl-4 pr-8 py-2 rounded-full font-black text-[11px] uppercase tracking-widest transition-all outline-none border focus:ring-4 focus:ring-teal-50",
                      p.isAvailable && p.availability !== "on_holiday" ? "bg-green-50 text-green-700 border-green-100" : 
                      p.isAvailable && p.availability === "on_holiday" ? "bg-amber-50 text-amber-700 border-amber-100" :
                      "bg-red-50 text-red-700 border-red-100"
                    )}
                  >
                    <option value="available">● Available Now</option>
                    <option value="away">● Away / Holiday</option>
                    <option value="busy">● Busy / Offline</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
                </div>
                <div className="w-8 h-8 rounded-full border border-gray-100 flex items-center justify-center text-gray-300">
                  <Clock size={14} />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Hourly Rate</span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black font-josefin text-[#0f172a]">₹</span>
                    <EditableText 
                      value={p.hourlyRate?.toString() || "0"} 
                      onSave={(val) => queuePatch({ hourlyRate: Number(val) })} 
                      className="text-3xl font-black font-josefin text-[#0f172a]"
                      numeric
                    />
                    <span className="text-sm font-bold text-gray-400 mt-2">/hr</span>
                  </div>
                </div>

                <div className="h-px bg-gray-50" />

                <div className="grid grid-cols-1 gap-4">
                  <DetailRow label="Hourly Rate" val={`₹${p.hourlyRate || 0}/hr`} onEdit={(val) => {
                    const num = parseInt(val.replace(/\D/g, ''));
                    if (!isNaN(num)) queuePatch({ hourlyRate: num });
                  }} />
                  <DetailRow label="Work Type" val="Monthly / Fixed" />
                  <DetailRow label="Per Week" val={p.availability || "30 hrs/week"} onEdit={(val) => {
                    queuePatch({ availability: val });
                  }} />
                  <DetailRow label="Languages" val={p.languages?.map(l => l.name).join(", ") || "English"} />
                </div>
              </div>
            </div>

            {/* PROFILE STRENGTH CARD */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
              <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-widest mb-6">Profile Strength</h3>
              <div className="flex items-center gap-6 mb-8">
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-full h-full rotate-[-90deg]" viewBox="0 0 100 100">
                    <circle stroke="#f1f5f9" strokeWidth="10" fill="transparent" r="40" cx="50" cy="50" />
                    <circle
                      stroke="url(#tealGradient)"
                      strokeWidth="10"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * completeness) / 100}
                      strokeLinecap="round"
                      fill="transparent" r="40" cx="50" cy="50"
                      style={{ transition: "stroke-dashoffset 0.6s ease" }}
                    />
                    <defs>
                      <linearGradient id="tealGradient" x1="1" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2d7a7e" />
                        <stop offset="100%" stopColor="#6d9c9f" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-[#0f172a]">{completeness}%</span>
                  </div>
                </div>
                <p className="text-xs font-medium text-gray-500">Add <span className="text-teal-600 font-bold">Experience</span> to reach 95%!</p>
              </div>

              <div className="space-y-3">
                <CheckItem done={!!p.image} label="Profile Photo" />
                <CheckItem done={!!p.headline} label="Headline" onClick={() => setEditMode('headline')} />
                <CheckItem done={(p.skills?.length || 0) >= 3} label="Verified Skills" onClick={() => setShowSkills(true)} />
                <CheckItem done={(p.portfolio?.length || 0) >= 1} label="Portfolio Upload" onClick={() => setShowPortfolio(true)} />
                <CheckItem done={(p.education?.length || 0) >= 1} label="Education" onClick={() => setShowEducation(true)} />
                <CheckItem done={(p.experience?.length || 0) >= 1} label="Experience" onClick={() => setShowExperience(true)} />
              </div>

              {/* Controlled Modals */}
              <AddSkillModal open={showSkills} onOpenChange={setShowSkills} />
              <AddPortfolioModal open={showPortfolio} onOpenChange={setShowPortfolio} />
              <AddExperienceModal open={showExperience} onOpenChange={setShowExperience} />
              <AddEducationModal open={showEducation} onOpenChange={setShowEducation} />

              <div className="mt-8 p-4 bg-teal-50 rounded-2xl flex gap-3">
                <Lightbulb size={20} className="text-teal-500 shrink-0" />
                <p className="text-[11px] font-bold text-teal-700 leading-relaxed">
                  Profiles with portfolio items get <span className="font-black">3x more invitations</span> from clients.
                </p>
              </div>
            </div>

            {/* BADGES & ACHIEVEMENTS */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
              <h3 className="text-sm font-black text-[#0f172a] uppercase tracking-widest mb-6">Achievements</h3>
              <div className="grid grid-cols-3 gap-4">
                <BadgeItem id="top-rated" name="Top Rated" icon="🏆" active />
                <BadgeItem id="fast" name="Fast Resp." icon="⚡" active />
                <BadgeItem id="verified" name="Verified" icon="✅" active />
                <BadgeItem id="rising" name="Rising Star" icon="🌟" />
                <BadgeItem id="expert" name="Expert" icon="🎯" />
                <BadgeItem id="loyal" name="Veteran" icon="🔥" />
              </div>
            </div>

            {/* SOCIAL LINKS */}
            <div className="bg-white rounded-3xl border border-gray-200 p-8 shadow-sm">
              <Header title="Links & Profiles" mini />
              <div className="mt-6 space-y-4">
                <SocialLink icon={<Linkedin size={16} />} label="LinkedIn" url={p.linkedinUrl || ""} color="text-[#0077b5]" onSave={(val: string) => queuePatch({ linkedinUrl: val })} />
                <SocialLink icon={<Github size={16} />} label="GitHub" url={p.githubUrl || ""} color="text-black" onSave={(val: string) => queuePatch({ githubUrl: val })} />
                <SocialLink icon={<Globe size={16} />} label="Website" url={p.websiteUrl || ""} color="text-teal-600" onSave={(val: string) => queuePatch({ websiteUrl: val })} />
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

/* ------------------- Local Helpers ------------------- */

function StatItem({ label, val, sub, divider, icon }: any) {
  return (
    <div className={cn("flex flex-col items-center text-center", divider && "md:border-l border-gray-100")}>
      <div className="flex items-center gap-1.5 font-black font-josefin text-2xl text-[#0f172a]">
        {icon} {val}
      </div>
      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">{label}</p>
      <p className="text-[10px] font-bold text-teal-600 mt-0.5">{sub}</p>
    </div>
  )
}

function Section({ children, elevation = "none" }: { children: React.ReactNode, elevation?: "white" | "none" }) {
  return (
    <div className={cn(
      "rounded-3xl border border-gray-200 p-8",
      elevation === "white" ? "bg-white shadow-sm" : "bg-transparent"
    )}>
      {children}
    </div>
  )
}

function Header({ title, edit, action, mini }: any) {
  return (
    <div className="flex justify-between items-center mb-6">
      <h3 className={cn("font-black text-[#0f172a] uppercase tracking-widest", mini ? "text-xs" : "text-sm")}>{title}</h3>
      <div className="flex items-center gap-2">
        {action}
        {edit && <button onClick={edit} className="p-2 rounded-full hover:bg-teal-50 text-gray-300 hover:text-teal-500 transition-colors"><Pencil size={14} /></button>}
      </div>
    </div>
  )
}

function DetailRow({ label, val, onEdit }: { label: string, val: string, onEdit?: (val: string) => void }) {
  const [isEditing, setIsEditing] = useState(false)
  const [temp, setTemp] = useState(val)

  useEffect(() => { setTemp(val) }, [val])

  const save = () => {
    onEdit?.(temp)
    setIsEditing(false)
  }

  return (
    <div className="flex justify-between items-center group min-h-[24px]">
      <span className="text-[11px] font-bold text-gray-400 uppercase">{label}</span>
      <div className="flex items-center gap-2 flex-1 justify-end ml-4">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input 
              autoFocus
              className="w-24 bg-transparent border-b border-teal-500 text-xs font-black text-[#0f172a] text-right focus:outline-none"
              value={temp}
              onChange={(e) => setTemp(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') save();
                if (e.key === 'Escape') setIsEditing(false);
              }}
            />
            <button onClick={save} className="text-[9px] font-black text-teal-600 uppercase">Ok</button>
          </div>
        ) : (
          <>
            <span className="text-xs font-black text-[#0f172a] truncate">{val}</span>
            {onEdit && <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 text-teal-500 transition-opacity"><Pencil size={11} /></button>}
          </>
        )}
      </div>
    </div>
  )
}

function EditableText({ value, onSave, className, numeric }: { value: string, onSave: (val: string) => void, className?: string, numeric?: boolean }) {
  const [isEditing, setIsEditing] = useState(false)
  const [temp, setTemp] = useState(value)

  useEffect(() => { setTemp(value) }, [value])

  const save = () => {
    onSave(temp)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input 
          autoFocus
          type={numeric ? "number" : "text"}
          className={cn("bg-transparent border-b-2 border-teal-500 focus:outline-none", className)}
          value={temp}
          onChange={(e) => setTemp(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
            if (e.key === 'Escape') setIsEditing(false);
          }}
        />
        <div className="flex flex-col gap-0.5">
          <button onClick={save} className="text-[10px] font-black text-teal-600 uppercase leading-none hover:text-teal-700">Save</button>
          <button onClick={() => setIsEditing(false)} className="text-[10px] font-black text-gray-400 uppercase leading-none hover:text-gray-500">No</button>
        </div>
      </div>
    )
  }

  return (
    <div className="group flex items-center gap-2 cursor-pointer" onClick={() => setIsEditing(true)}>
      <span className={className}>{value}</span>
      <Pencil size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  )
}

function CheckItem({ done, label, onClick }: { done: boolean, label: string, onClick?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <div className={cn("w-4 h-4 rounded-full flex items-center justify-center", done ? "bg-teal-500 text-white" : "border-2 border-gray-100")}>
          {done && <CheckCircle2 size={10} />}
        </div>
        <span className={cn("text-[11px] font-bold uppercase tracking-wider", done ? "text-[#0f172a]" : "text-gray-300")}>{label}</span>
      </div>
      {done ? <CheckCircle2 size={12} className="text-teal-500" /> : <div className="text-[10px] font-black text-teal-600 uppercase cursor-pointer hover:underline" onClick={onClick}>+ Add</div>}
    </div>
  )
}

function BadgeItem({ name, icon, active, id }: any) {
  return (
    <div className={cn("flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all", active ? "bg-[#f8fafc] border-gray-100" : "opacity-30 grayscale border-transparent")}>
      <div className="text-2xl">{icon}</div>
      <span className="text-[9px] font-black text-center uppercase tracking-tighter leading-tight">{name}</span>
    </div>
  )
}

function SocialLink({ icon, label, url, color, onSave }: any) {
  const [isEditing, setIsEditing] = useState(false)
  const [val, setVal] = useState(url)

  useEffect(() => { setVal(url) }, [url])

  const handleSave = () => {
    onSave(val)
    setIsEditing(false)
  }

  return (
    <div className="p-3 rounded-2xl border border-gray-50 hover:border-teal-100 bg-white transition-all group">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center", color)}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-gray-400 uppercase leading-none">{label}</p>
            {isEditing ? (
              <input 
                autoFocus
                className="w-full bg-transparent border-b border-teal-500 text-xs font-bold text-[#0f172a] focus:outline-none mt-1"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSave();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
            ) : (
              <p className="text-xs font-bold text-[#0f172a] truncate w-40 mt-1">{url || "Not linked"}</p>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <div className="flex items-center gap-2">
            <button onClick={handleSave} className="text-[10px] font-black uppercase text-teal-600 hover:text-teal-700">Save</button>
            <button onClick={() => setIsEditing(false)} className="text-[10px] font-black uppercase text-gray-400 hover:text-gray-500">No</button>
          </div>
        ) : (
          <button onClick={() => setIsEditing(true)} className="text-gray-200 group-hover:text-teal-500 transition-colors"><Pencil size={14} /></button>
        )}
      </div>
    </div>
  )
}
