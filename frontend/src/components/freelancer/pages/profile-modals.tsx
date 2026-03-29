"use client"

import { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { qk } from "@/lib/realtime/query-keys"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { addSkill, addPortfolio, addExperience, addEducation, removeSkill, removeExperience, removeEducation } from "@/app/freelancer/profile/actions"

export function AddSkillModal({ open: controlledOpen, onOpenChange }: { open?: boolean, onOpenChange?: (open: boolean) => void } = {}) {
  const qc = useQueryClient()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [name, setName] = useState("")
  const [level, setLevel] = useState("Expert")

  const m = useMutation({
    mutationFn: () => addSkill(name, level),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: qk.freelancerProfile() })
      const prev = qc.getQueryData(qk.freelancerProfile())
      qc.setQueryData(qk.freelancerProfile(), (old: any) => ({
        ...old,
        skills: [...(old?.skills || []), { id: Date.now().toString(), name, level }]
      }))
      setOpen(false)
      setName("")
      setLevel("Expert")
      toast.success("Skill added")
      return { prev }
    },
    onError: (err, variables, context) => {
      qc.setQueryData(qk.freelancerProfile(), context?.prev)
      toast.error("Failed to add skill")
    },
    onSettled: () => qc.invalidateQueries({ queryKey: qk.freelancerProfile() })
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 border-dashed border-teal-100 text-teal-600 text-sm font-bold hover:bg-teal-50 transition-colors">
            <Plus size={16} /> Add Skill
          </button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader><DialogTitle>Add Skill</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4">
          <input className="w-full p-3 border rounded-xl" placeholder="Skill Name (e.g. React.js)" value={name} onChange={e => setName(e.target.value)} />
          <select className="w-full p-3 border rounded-xl" value={level} onChange={e => setLevel(e.target.value)}>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Expert</option>
          </select>
          <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={() => m.mutate()} disabled={!name || m.isPending}>Add Skill</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddPortfolioModal({ open: controlledOpen, onOpenChange }: { open?: boolean, onOpenChange?: (open: boolean) => void } = {}) {
  const qc = useQueryClient()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [title, setTitle] = useState("")
  const [desc, setDesc] = useState("")
  const [url, setUrl] = useState("")

  const m = useMutation({
    mutationFn: () => addPortfolio(title, desc, url),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.freelancerProfile() })
      toast.success("Portfolio item added")
      setOpen(false)
      setTitle(""); setDesc(""); setUrl("")
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="ghost" className="text-teal-600 font-black text-xs uppercase hover:bg-teal-50"><Plus size={14} className="mr-1" /> Add Work</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader><DialogTitle>Add to Portfolio</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4">
          <input className="w-full p-3 border rounded-xl" placeholder="Project Title" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="w-full p-3 border rounded-xl" placeholder="Project URL (Required)" value={url} onChange={e => setUrl(e.target.value)} />
          <textarea className="w-full p-3 border rounded-xl" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
          <div className="rounded-xl border border-dashed p-4 text-center text-xs font-medium text-gray-500">
            Image upload is disabled. Portfolio cards will open this project URL directly.
          </div>
          <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={() => m.mutate()} disabled={!title || !url || m.isPending}>Save Portfolio</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddExperienceModal({ open: controlledOpen, onOpenChange }: { open?: boolean, onOpenChange?: (open: boolean) => void } = {}) {
  const qc = useQueryClient()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [title, setTitle] = useState("")
  const [company, setCompany] = useState("")
  const [loc, setLoc] = useState("")
  const [sys, setSys] = useState(2020)
  const [eys, setEys] = useState(2024)
  const [cur, setCur] = useState(false)
  const [desc, setDesc] = useState("")

  const m = useMutation({
    mutationFn: () => addExperience(title, company, sys, cur ? null : eys, loc, desc),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.freelancerProfile() })
      toast.success("Experience added")
      setOpen(false)
      setTitle(""); setCompany(""); setDesc("")
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="ghost" className="text-teal-600 font-black text-[11px] uppercase hover:bg-teal-50"><Plus size={14} className="mr-1" /> Experience</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader><DialogTitle>Add Experience</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4">
          <input className="w-full p-3 border rounded-xl" placeholder="Job Title" value={title} onChange={e => setTitle(e.target.value)} />
          <input className="w-full p-3 border rounded-xl" placeholder="Company" value={company} onChange={e => setCompany(e.target.value)} />
          <input className="w-full p-3 border rounded-xl" placeholder="Location" value={loc} onChange={e => setLoc(e.target.value)} />
          <div className="flex gap-4">
            <input type="number" className="w-full p-3 border rounded-xl" placeholder="Start Year" value={sys} onChange={e => setSys(Number(e.target.value))} />
            {!cur && <input type="number" className="w-full p-3 border rounded-xl" placeholder="End Year" value={eys} onChange={e => setEys(Number(e.target.value))} />}
          </div>
          <label className="flex items-center gap-2"><input type="checkbox" checked={cur} onChange={e => setCur(e.target.checked)} /> I currently work here</label>
          <textarea className="w-full p-3 border rounded-xl" placeholder="Description" value={desc} onChange={e => setDesc(e.target.value)} />
          <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={() => m.mutate()} disabled={!title || !company || m.isPending}>Save Experience</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function AddEducationModal({ open: controlledOpen, onOpenChange }: { open?: boolean, onOpenChange?: (open: boolean) => void } = {}) {
  const qc = useQueryClient()
  const [internalOpen, setInternalOpen] = useState(false)
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen
  const setOpen = onOpenChange || setInternalOpen
  const [inst, setInst] = useState("")
  const [deg, setDeg] = useState("")
  const [fld, setFld] = useState("")
  const [sys, setSys] = useState(2016)
  const [eys, setEys] = useState(2020)

  const m = useMutation({
    mutationFn: () => addEducation(inst, deg, fld, sys, eys),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.freelancerProfile() })
      toast.success("Education added")
      setOpen(false)
      setInst(""); setDeg(""); setFld("")
    }
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="ghost" className="text-teal-600 font-black text-[11px] uppercase hover:bg-teal-50"><Plus size={14} className="mr-1" /> Education</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader><DialogTitle>Add Education</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4">
          <input className="w-full p-3 border rounded-xl" placeholder="Institution / University" value={inst} onChange={e => setInst(e.target.value)} />
          <input className="w-full p-3 border rounded-xl" placeholder="Degree (e.g. B.Tech)" value={deg} onChange={e => setDeg(e.target.value)} />
          <input className="w-full p-3 border rounded-xl" placeholder="Field of Study" value={fld} onChange={e => setFld(e.target.value)} />
          <div className="flex gap-4">
            <input type="number" className="w-full p-3 border rounded-xl" placeholder="Start Year" value={sys} onChange={e => setSys(Number(e.target.value))} />
            <input type="number" className="w-full p-3 border rounded-xl" placeholder="End Year" value={eys} onChange={e => setEys(Number(e.target.value))} />
          </div>
          <Button className="w-full bg-teal-600 hover:bg-teal-700" onClick={() => m.mutate()} disabled={!inst || !deg || m.isPending}>Save Education</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function SkillRemoveButton({ id }: { id: string }) {
  const qc = useQueryClient()
  return (
    <button 
      onClick={() => removeSkill(id).then(() => qc.invalidateQueries({ queryKey: qk.freelancerProfile() }))}
      className="opacity-0 group-hover:opacity-100 text-red-400 ml-1 transition-opacity cursor-pointer z-10"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
    </button>
  )
}

export function ExperienceDeleteButton({ id }: { id: string }) {
  const qc = useQueryClient()
  return (
    <button onClick={() => removeExperience(id).then(() => qc.invalidateQueries({ queryKey: qk.freelancerProfile() }))} className="text-gray-300 hover:text-red-500 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
    </button>
  )
}

export function EducationDeleteButton({ id }: { id: string }) {
  const qc = useQueryClient()
  return (
    <button onClick={() => removeEducation(id).then(() => qc.invalidateQueries({ queryKey: qk.freelancerProfile() }))} className="text-gray-300 hover:text-red-500 transition-colors">
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
    </button>
  )
}
