"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  Camera, 
  ChevronRight, 
  Check, 
  Eye, 
  EyeOff, 
  X, 
  Sprout, 
  TrendingUp, 
  Award, 
  Briefcase, 
  Building2, 
  Pen as PenIcon, 
  Globe, 
  Linkedin, 
  Github, 
  Plus, 
  Trash2, 
  Search,
  CheckCircle2,
  Clock,
  Shield,
  Zap,
  Users,
  AlertCircle,
  Award as TrophyIcon
} from "lucide-react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { UploadButton } from "@/lib/uploadthing-react"
import { toast } from "sonner"
import { formatCurrency } from "@/lib/currency"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"

/* ------------------- Constants & Schemas ------------------- */

const CATEGORIES = [
  { id: "Development", name: "Development" },
  { id: "Design", name: "Design" },
  { id: "Writing", name: "Writing" },
  { id: "Marketing", name: "Marketing" },
  { id: "Video", name: "Video" },
  { id: "SEO", name: "SEO" },
  { id: "Data & Analytics", name: "Data & Analytics" },
  { id: "DevOps", name: "DevOps" },
  { id: "Consulting", name: "Consulting" },
  { id: "Education", name: "Education" },
]

const SKILLS_PRESET = [
  "React", "Node.js", "TypeScript", "Python", "UI/UX Design", "Copywriting", 
  "SEO", "Data Analysis", "Digital Marketing", "Figma", "DevOps", "AWS", 
  "Full Stack Development", "Mobile App Development", "Illustrator", "Photoshop",
  "WordPress", "GraphQL", "Solidity", "Machine Learning"
]

const PROFICIENCY_LEVELS = ["Beginner", "Intermediate", "Advanced", "Expert"]

const PASSWORD_REQUIREMENTS = [
  { label: "8+ characters", regex: /.{8,}/ },
  { label: "One uppercase letter", regex: /[A-Z]/ },
  { label: "One number", regex: /[0-9]/ },
  { label: "One special character", regex: /[^A-Za-z0-9]/ },
]

const schema = z.object({
  // Step 1: Personal
  image: z.string().optional(),
  name: z.string().min(2, "Full name is required"),
  dob: z.string().refine((val) => {
    const age = (new Date().getTime() - new Date(val).getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    return age >= 16
  }, "You must be at least 16 years old"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Valid 10-digit Indian number required"),
  email: z.string().email("Invalid email format"),
  city: z.string().optional(),
  state: z.string().optional(),
  pinCode: z.string().optional(),
  gender: z.string().optional(),
  password: z.string()
    .min(8)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
  confirmPassword: z.string(),
  
  // Step 2: Professional
  headline: z.string().min(5).max(80),
  summary: z.string().min(100, "Bio must be at least 100 characters"),
  category: z.string().min(1, "Select a category"),
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "EXPERT"]),
  hourlyRate: z.number().min(100).max(10000),
  languages: z.array(z.object({
    name: z.string(),
    proficiency: z.string()
  })).min(1),
  
  // Step 3: Skills
  skills: z.array(z.object({
    name: z.string(),
    level: z.string()
  })).min(3, "Add at least 3 skills"),
  
  // Step 4: Portfolio & Links
  portfolio: z.array(z.object({
    title: z.string(),
    imageUrl: z.string()
  })).optional(),
  linkedinUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  
  // Terms
  agreeToTerms: z.literal(true, {
    errorMap: () => ({ message: "You must agree to the terms" })
  })
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
})

type FormData = z.infer<typeof schema>

/* ------------------- Main Component ------------------- */

export function FreelancerRegisterWizard() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { 
    register, 
    handleSubmit, 
    watch, 
    setValue, 
    formState: { errors, isValid },
    trigger,
    control
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      category: "",
      experienceLevel: "INTERMEDIATE",
      hourlyRate: 500,
      languages: [{ name: "English", proficiency: "Fluent" }],
      skills: [],
      portfolio: [],
      gender: "Prefer not to say"
    }
  })

  const { fields: languageFields, append: appendLanguage, remove: removeLanguage } = useFieldArray({
    control,
    name: "languages"
  })

  // Watchers
  const watchedCategory = watch("category")
  const watchedSkills = watch("skills") || []
  const watchedImage = watch("image")
  const watchedPassword = watch("password") || ""
  const watchedName = watch("name")
  const watchedEmail = watch("email")
  const watchedHeadline = watch("headline")
  const watchedSummary = watch("summary")
  const watchedRate = watch("hourlyRate")
  const watchedPortfolio = watch("portfolio") || []

  // Progress steps
  const steps = [
    { id: 1, label: "Personal" },
    { id: 2, label: "Professional" },
    { id: 3, label: "Skills" },
    { id: 4, label: "Portfolio" },
    { id: 5, label: "Review" },
  ]

  const nextStep = async () => {
    let fieldsToValidate: any[] = []
    if (step === 1) fieldsToValidate = ["name", "dob", "phone", "email", "password", "confirmPassword"]
    if (step === 2) fieldsToValidate = ["headline", "summary", "category", "experienceLevel", "hourlyRate", "languages"]
    if (step === 3) fieldsToValidate = ["skills"]
    if (step === 4) fieldsToValidate = ["portfolio", "linkedinUrl", "githubUrl", "websiteUrl"]
    
    const isStepValid = await trigger(fieldsToValidate)
    if (isStepValid) {
      setStep(s => Math.min(5, s + 1))
      window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
      toast.error("Please fix the errors before continuing")
    }
  }

  const prevStep = () => setStep(s => Math.max(1, s - 1))

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          name: data.name,
          role: "FREELANCER",
          // Extra onboarding fields can be handled by a separate onboarding API or updated in register
          onboardingData: {
            ...data,
            // Confirm password is not needed in DB
            confirmPassword: undefined
          }
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Registration failed")
      }

      const sign = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (sign?.error) {
        toast.error("Account created, but could not sign in automatically.")
        router.push("/auth/signin")
        return
      }

      toast.success("Profile launched! Welcome to Contractual.")
      router.push("/freelancer/dashboard")
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Password Strength
  const passwordStrength = useMemo(() => {
    let count = 0
    if (watchedPassword.length >= 8) count++
    if (/[A-Z]/.test(watchedPassword)) count++
    if (/[0-9]/.test(watchedPassword)) count++
    if (/[^A-Za-z0-9]/.test(watchedPassword)) count++
    
    if (count === 0) return { label: "", color: "bg-gray-200" }
    if (count <= 1) return { label: "Weak", color: "bg-red-500" }
    if (count === 2) return { label: "Fair", color: "bg-amber-500" }
    if (count === 3) return { label: "Strong", color: "bg-green-500" }
    return { label: "Very Strong", color: "bg-teal-500" }
  }, [watchedPassword])

  // Profile Completeness
  const completeness = useMemo(() => {
    let score = 0
    if (watchedImage) score += 15
    if (watchedHeadline) score += 10
    if (watchedSummary && watchedSummary.length >= 50) score += 15
    if (watchedSkills.length >= 3) score += 15
    if (watchedRate) score += 10
    if (watchedPortfolio.length >= 1) score += 15
    if (languageFields.length > 0) score += 5
    // Add logic for education etc. if needed
    return score
  }, [watchedImage, watchedHeadline, watchedSummary, watchedSkills, watchedRate, watchedPortfolio, languageFields])

  return (
    <div className="min-h-screen flex bg-white font-plus-jakarta">
      {/* 40% Left Panel */}
      <div className="hidden lg:flex lg:w-[40%] bg-gradient-to-br from-[#0f172a] via-[#0f3460] to-[#2d7a7e] p-12 flex-col justify-between relative overflow-hidden text-white">
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} 
        />
        
        <div className="relative z-10">
          <Link href="/" className="flex items-center gap-2 mb-16">
            <Shield className="w-8 h-8 text-white" />
            <span className="text-2xl font-black font-josefin tracking-tight">Contractual</span>
          </Link>
          
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-black font-josefin leading-tight mb-4">
              Join 12,000+ freelancers already earning
            </h2>
            <p className="text-lg text-white/70 font-medium">
              Find high-quality gigs, work with top businesses, and secure your career in the data-driven world.
            </p>
          </motion.div>
        </div>

        <div className="relative z-10 space-y-6">
          {/* Animated Stats Cards Item 1 */}
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-2xl"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-teal-400/20 flex items-center justify-center">
                <TrophyIcon className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white/50 uppercase tracking-widest">Global Earnings</p>
                <p className="text-2xl font-black tracking-tight">₹45.6M+</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
             animate={{ y: [0, 10, 0] }}
             transition={{ duration: 5, repeat: Infinity, delay: 0.5 }}
             className="w-full max-w-sm bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 ml-auto shadow-2xl"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-400/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium italic text-white/90">
                  &ldquo;Contractual changed my freelancing career. I now work with international clients daily.&rdquo;
                </p>
                <div className="mt-2 text-xs">
                  <span className="font-bold">Rahul Mehta</span> • UI/UX Designer
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 60% Right Panel */}
      <div className="w-full lg:w-[60%] overflow-y-auto px-6 py-12 lg:px-24">
        <div className="max-w-[520px] mx-auto">
          
          {/* Progress Bar */}
          <div className="mb-12 relative flex items-center justify-between">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -translate-y-1/2 -z-10" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-teal-500 -translate-y-1/2 -z-10 transition-all duration-500" 
              style={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
            />
            
            {steps.map((s) => (
              <div key={s.id} className="flex flex-col items-center gap-2">
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500",
                  step > s.id ? "bg-teal-500 text-white" : 
                  step === s.id ? "bg-white border-4 border-teal-500 text-teal-600 ring-8 ring-teal-50" : 
                  "bg-white border-2 border-gray-200 text-gray-400"
                )}>
                  {step > s.id ? <Check className="w-4 h-4" /> : s.id}
                </div>
                <span className={cn(
                  "text-[11px] font-bold uppercase tracking-wider",
                  step >= s.id ? "text-teal-600" : "text-gray-400"
                )}>
                  {s.label}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            <AnimatePresence mode="wait">
              
              {/* --- STEP 1: PERSONAL --- */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-10">
                    <h1 className="text-3xl font-black font-josefin text-[#0f172a]">{"Let's start with your basics"}</h1>
                    <p className="text-gray-500 font-medium mt-1">This information helps clients know who you are</p>
                  </div>

                  {/* Photo Upload */}
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative group">
                      <div className={cn(
                        "w-[120px] h-[120px] rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all",
                        watchedImage ? "border-teal-500 ring-4 ring-teal-50" : "border-teal-200 bg-[#f0f9f9]"
                      )}>
                        {watchedImage ? (
                          <Image src={watchedImage} fill alt="Preview" className="object-cover" />
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-teal-600">
                            <Camera className="w-8 h-8" />
                            <span className="text-[11px] font-bold uppercase">Upload</span>
                          </div>
                        )}
                      </div>
                      <UploadButton
                        endpoint="avatars"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onClientUploadComplete={(res) => {
                          if (res?.[0]) setValue("image", res[0].url)
                        }}
                      />
                      {watchedImage && (
                        <button 
                          type="button"
                          onClick={() => setValue("image", undefined)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-[#94a3b8] text-center max-w-[200px]">
                      JPG, PNG up to 5MB · Square photos work best
                    </p>
                  </div>

                  <div className="grid gap-6">
                    <FloatingInput label="Full Name *" error={errors.name?.message} {...register("name")} />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FloatingInput label="Date of Birth *" type="date" error={errors.dob?.message} {...register("dob")} />
                      <div className="relative">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Phone Number *</label>
                        <div className="flex gap-2">
                          <div className="flex h-12 w-16 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold">🇮🇳 +91</div>
                          <input 
                            className="h-12 flex-1 rounded-xl border border-gray-200 px-4 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
                            placeholder="9876543210"
                            {...register("phone")}
                          />
                        </div>
                        {errors.phone && <p className="mt-1 text-xs text-red-500">{errors.phone.message}</p>}
                      </div>
                    </div>
                    <FloatingInput label="Email Address *" type="email" error={errors.email?.message} {...register("email")} />
                    
                    <div>
                      <label className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3 block">Gender (optional)</label>
                      <div className="grid grid-cols-3 gap-3">
                        {["Male", "Female", "Other"].map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() => setValue("gender", g)}
                            className={cn(
                              "h-12 rounded-xl border-2 text-sm font-bold transition-all",
                              watch("gender") === g 
                                ? "border-teal-500 bg-teal-50 text-teal-700 shadow-md" 
                                : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                            )}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="relative">
                        <FloatingInput label="Password *" type="password" error={errors.password?.message} {...register("password")} />
                      </div>
                      
                      {/* Strength Indicator */}
                      {watchedPassword && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <span className="text-gray-400">Security Strength</span>
                            <span style={{ color: passwordStrength.color.replace('bg-', '') }}>{passwordStrength.label}</span>
                          </div>
                          <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                            <motion.div 
                              className={cn("h-full transition-all duration-500", passwordStrength.color)}
                              initial={{ width: 0 }}
                              animate={{ width: `${(watchedPassword.length >= 8 ? 25 : 0) + (/[A-Z]/.test(watchedPassword) ? 25 : 0) + (/[0-9]/.test(watchedPassword) ? 25 : 0) + (/[^A-Za-z0-9]/.test(watchedPassword) ? 25 : 0)}%` }}
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                            {PASSWORD_REQUIREMENTS.map((r) => {
                              const ok = r.regex.test(watchedPassword)
                              return (
                                <div key={r.label} className={cn("flex items-center gap-1.5 text-[10px] font-bold uppercase", ok ? "text-teal-600" : "text-gray-300")}>
                                  <div className={cn("w-1.5 h-1.5 rounded-full", ok ? "bg-teal-500" : "bg-gray-200")} />
                                  {r.label}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <FloatingInput label="Confirm Password *" type="password" error={errors.confirmPassword?.message} {...register("confirmPassword")} />
                  </div>

                  <Button 
                    type="button" 
                    onClick={nextStep}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-teal-500 to-teal-700 text-white font-black text-base shadow-xl shadow-teal-500/20 hover:scale-[1.02] transition-transform"
                  >
                    Continue <ChevronRight className="ml-2 w-5 h-5" />
                  </Button>
                  
                  <p className="text-center text-sm text-gray-500">
                    Already have an account? <Link href="/auth/signin" className="text-teal-600 font-bold hover:underline">Sign in</Link>
                  </p>
                </motion.div>
              )}

              {/* --- STEP 2: PROFESSIONAL --- */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-10">
                    <h1 className="text-3xl font-black font-josefin text-[#0f172a]">{"Tell us about your work"}</h1>
                  </div>

                  <div className="grid gap-6">
                    <div>
                      <FloatingInput label="Professional Headline *" error={errors.headline?.message} maxLength={80} {...register("headline")} />
                      <p className="mt-1 text-[10px] text-right text-gray-400 font-bold uppercase">{(watchedHeadline || "").length}/80</p>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 block">Professional Summary *</label>
                      <textarea 
                        className="w-full rounded-xl border border-gray-200 p-4 text-sm font-medium outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50 min-h-[120px]"
                        placeholder="Describe your background and expertise..."
                        {...register("summary")}
                      />
                      <div className="flex justify-between mt-1 text-[10px] font-bold uppercase">
                        <span className={cn((watchedSummary || "").length >= 100 ? "text-teal-500" : "text-amber-500")}>min. 100 chars</span>
                        <span className="text-gray-400">{(watchedSummary || "").length}/500</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 block">Primary Category *</label>
                      <div className="grid grid-cols-2 gap-3">
                        {CATEGORIES.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setValue("category", c.id)}
                            className={cn(
                              "p-4 rounded-xl border-2 text-left transition-all group",
                              watchedCategory === c.id 
                                ? "border-teal-500 bg-teal-50" 
                                : "border-gray-100 hover:border-teal-100 bg-white"
                            )}
                          >
                            <p className={cn(
                              "text-[13px] font-bold",
                              watchedCategory === c.id ? "text-teal-700" : "text-gray-700"
                            )}>{c.name}</p>
                          </button>
                        ))}
                      </div>
                      {errors.category && <p className="mt-2 text-xs text-red-500">{errors.category.message}</p>}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 block">Experience Level *</label>
                      <div className="grid grid-cols-1 gap-3">
                        <ExperienceCard 
                          title="Entry Level" 
                          desc="Less than 1 year of professional experience" 
                          icon={<Sprout />} 
                          active={watch("experienceLevel") === "BEGINNER"}
                          onClick={() => setValue("experienceLevel", "BEGINNER")}
                        />
                        <ExperienceCard 
                          title="Intermediate" 
                          desc="1–4 years of experience in your field" 
                          icon={<TrendingUp />} 
                          active={watch("experienceLevel") === "INTERMEDIATE"}
                          onClick={() => setValue("experienceLevel", "INTERMEDIATE")}
                        />
                        <ExperienceCard 
                          title="Expert" 
                          desc="5+ years, recognized authority in your field" 
                          icon={<Award />} 
                          active={watch("experienceLevel") === "EXPERT"}
                          onClick={() => setValue("experienceLevel", "EXPERT")}
                        />
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 p-6 bg-gray-50/50">
                      <div className="flex justify-between items-center mb-6">
                        <div>
                          <label className="text-[13px] font-bold text-[#0f172a] block">Hourly Rate *</label>
                          <p className="text-xs text-gray-500 font-medium mt-0.5">How much do you charge per hour?</p>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-black text-gray-400">₹</span>
                          <input 
                            type="number"
                            className="h-12 w-32 rounded-xl border border-gray-200 pl-7 pr-3 text-lg font-black text-[#0f172a] outline-none focus:border-teal-500 ring-4 focus:ring-teal-50"
                            {...register("hourlyRate", { valueAsNumber: true })}
                          />
                        </div>
                      </div>
                      <input 
                        type="range" min={100} max={10000} step={100}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        value={watchedRate}
                        onChange={(e) => setValue("hourlyRate", Number(e.target.value))}
                      />
                      <div className="flex justify-between mt-3">
                        <span className="text-[11px] font-bold text-gray-400">₹100</span>
                        <div className="bg-teal-500 text-white px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider">
                          You earn {formatCurrency(watchedRate * 10)} per 10h
                        </div>
                        <span className="text-[11px] font-bold text-gray-400">₹10,000</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={prevStep} className="h-12 flex-1 rounded-xl border-gray-200 font-bold">Back</Button>
                    <Button type="button" onClick={nextStep} className="h-12 flex-[2] rounded-xl bg-teal-600 text-white font-black text-base shadow-xl shadow-teal-500/10">Continue</Button>
                  </div>
                </motion.div>
              )}

              {/* --- STEP 3: SKILLS --- */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <div className="text-center mb-10">
                    <h1 className="text-3xl font-black font-josefin text-[#0f172a]">What are you great at?</h1>
                    <p className="text-gray-500 font-medium mt-1">Add at least 3 skills to get better gig matches</p>
                  </div>

                  <div className="space-y-6">
                    <SkillSearch 
                      onAdd={(name) => {
                        const exists = watchedSkills.find(s => s.name === name)
                        if (!exists) setValue("skills", [...watchedSkills, { name, level: "Intermediate" }])
                      }} 
                    />

                    <div className="flex flex-wrap gap-2 min-h-[100px] p-6 rounded-2xl border-2 border-dashed border-gray-100 bg-gray-50/30">
                      {watchedSkills.map((s, idx) => (
                        <div key={s.name} className="flex items-center gap-2 bg-[#e8f4f5] text-[#2d7a7e] border border-[#b0d4d6] pr-2 pl-4 py-1.5 rounded-full text-xs font-bold transition-all animate-in zoom-in-95">
                          {s.name}
                          <select 
                             className="bg-transparent border-none outline-none text-[10px] font-black uppercase cursor-pointer"
                             value={s.level}
                             onChange={(e) => {
                               const newSkills = [...watchedSkills]
                               newSkills[idx].level = e.target.value
                               setValue("skills", newSkills)
                             }}
                          >
                            {PROFICIENCY_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                          </select>
                          <button onClick={() => setValue("skills", watchedSkills.filter(x => x.name !== s.name))} className="hover:text-red-500">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      {watchedSkills.length === 0 && <p className="m-auto text-gray-400 text-sm font-medium">No skills added yet</p>}
                    </div>

                    <div>
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3">Suggested for You</p>
                      <div className="flex flex-wrap gap-2">
                        {SKILLS_PRESET.filter(s => !watchedSkills.find(x => x.name === s)).slice(0, 8).map(s => (
                          <button 
                            key={s} type="button"
                            onClick={() => setValue("skills", [...watchedSkills, { name: s, level: "Intermediate" }])}
                            className="px-3 py-1.5 rounded-full border border-teal-100 text-teal-600 text-[11px] font-bold hover:bg-teal-50"
                          >
                            + {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={prevStep} className="h-12 flex-1 rounded-xl border-gray-200 font-bold">Back</Button>
                    <Button type="button" onClick={nextStep} disabled={watchedSkills.length < 3} className="h-12 flex-[2] rounded-xl bg-teal-600 text-white font-black text-base shadow-xl shadow-teal-500/10 disabled:opacity-50">Continue</Button>
                  </div>
                </motion.div>
              )}

              {/* --- STEP 4: PORTFOLIO --- */}
              {step === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <div className="text-center mb-10">
                    <h1 className="text-3xl font-black font-josefin text-[#0f172a]">{"Show your best work"}</h1>
                    <p className="text-gray-500 font-medium mt-1">Profiles with portfolio items get 3x more proposals</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {watchedPortfolio.map((item, idx) => (
                      <div key={idx} className="relative aspect-video rounded-xl overflow-hidden group">
                        <Image src={item.imageUrl} fill alt="" className="object-cover" />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 p-4 pt-8">
                           <input 
                              className="w-full bg-transparent border-none text-white text-xs font-bold outline-none placeholder:text-white/60"
                              placeholder="Add project title..."
                              value={item.title}
                              onChange={(e) => {
                                const newP = [...watchedPortfolio]
                                newP[idx].title = e.target.value
                                setValue("portfolio", newP)
                              }}
                           />
                        </div>
                        <button 
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => setValue("portfolio", watchedPortfolio.filter((_, i) => i !== idx))}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {watchedPortfolio.length < 6 && (
                      <div className="relative aspect-video border-2 border-dashed border-teal-200 rounded-xl bg-teal-50/50 flex flex-col items-center justify-center gap-2 group cursor-pointer hover:bg-teal-50 transition-colors">
                        <Plus className="w-8 h-8 text-teal-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[11px] font-black text-teal-600 uppercase">Add Work</span>
                        <UploadButton 
                          endpoint="portfolioFiles"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onClientUploadComplete={(res) => {
                            if (res?.[0]) setValue("portfolio", [...watchedPortfolio, { title: "", imageUrl: res[0].url }])
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 pt-10 border-t border-gray-100">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Connect Your Profiles</p>
                    <IconInput icon={<Linkedin className="text-blue-600" />} placeholder="linkedin.com/in/yourname" {...register("linkedinUrl")} />
                    <IconInput icon={<Github className="text-gray-900" />} placeholder="github.com/yourusername" {...register("githubUrl")} />
                    <IconInput icon={<Globe className="text-teal-600" />} placeholder="yourwebsite.com" {...register("websiteUrl")} />
                  </div>

                  <div className="flex gap-4">
                    <Button type="button" variant="outline" onClick={prevStep} className="h-12 flex-1 rounded-xl border-gray-200 font-bold">Back</Button>
                    <Button type="button" onClick={nextStep} className="h-12 flex-[2] rounded-xl bg-teal-600 text-white font-black text-base shadow-xl shadow-teal-500/10">Continue</Button>
                  </div>
                </motion.div>
              )}

              {/* --- STEP 5: REVIEW --- */}
              {step === 5 && (
                <motion.div
                  key="step5"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="text-center mb-10">
                    <h1 className="text-3xl font-black font-josefin text-[#0f172a]">Your profile preview</h1>
                    <p className="text-gray-500 font-medium mt-1">This is how clients will see you</p>
                  </div>

                  {/* Completeness Score Card */}
                  <div className="bg-teal-50 rounded-2xl p-8 border border-teal-100 flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-black font-josefin text-teal-900">{completeness}% Complete</h3>
                      <p className="text-sm text-teal-700 font-medium mt-1">Almost there! Your profile looks great.</p>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <CompletenessItem done={!!watchedImage} label="Photo" />
                        <CompletenessItem done={!!watchedHeadline} label="Headline" />
                        <CompletenessItem done={watchedSkills.length >= 3} label="Skills" />
                        <CompletenessItem done={watchedPortfolio.length >= 1} label="Portfolio" />
                      </div>
                    </div>
                    <div className="relative w-24 h-24">
                      <svg className="w-full h-full" viewBox="0 0 100 100">
                        <circle className="text-teal-100" strokeWidth="10" stroke="currentColor" fill="transparent" r="40" cx="50" cy="50" />
                        <circle 
                          className="text-teal-500 transition-all duration-1000" 
                          strokeWidth="10" 
                          strokeDasharray={251} 
                          strokeDashoffset={251 - (251 * completeness) / 100} 
                          strokeLinecap="round" 
                          stroke="currentColor" 
                          fill="transparent" 
                          r="40" cx="50" cy="50" 
                        />
                      </svg>
                    </div>
                  </div>

                  {/* MINI PREVIEW */}
                  <div className="rounded-2xl border border-gray-100 p-6 bg-white shadow-sm space-y-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 rounded-full bg-gray-100 overflow-hidden shrink-0">
                        {watchedImage ? <Image src={watchedImage} fill alt="Avatar" className="object-cover" /> : <div className="w-full h-full bg-teal-50" />}
                      </div>
                      <div>
                        <h4 className="text-xl font-black text-[#0f172a]">{watchedName || "Untitled Profile"}</h4>
                        <p className="text-sm font-bold text-teal-600 uppercase">{watchedHeadline || "Modern Freelancer"}</p>
                      </div>
                    </div>
                    <div className="h-px bg-gray-50" />
                    <p className="text-sm text-gray-500 line-clamp-3 leading-relaxed">{watchedSummary}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {watchedSkills.slice(0, 5).map(s => <span key={s.name} className="px-2 py-1 bg-gray-50 text-[10px] font-bold rounded uppercase">{s.name}</span>)}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-1 accent-teal-600" {...register("agreeToTerms")} />
                      <span className="text-sm text-gray-500 font-medium">
                        I agree to Contractual's <span className="text-teal-600 font-bold hover:underline">Terms of Service</span> and <span className="text-teal-600 font-bold hover:underline">Freelancer Agreement</span>
                      </span>
                    </label>
                    {errors.agreeToTerms && <p className="text-xs text-red-500">{errors.agreeToTerms.message}</p>}

                    {Object.keys(errors).length > 0 && (
                      <div className="rounded-xl bg-red-50 p-4 border border-red-100 mb-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 text-red-700 mb-2">
                          <AlertCircle className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider">Required Improvements</span>
                        </div>
                        <ul className="space-y-1">
                          {Object.entries(errors).map(([key, error]) => (
                            <li key={key} className="text-[11px] font-medium text-red-600 flex items-center gap-1.5 capitalize">
                              <div className="w-1 h-1 rounded-full bg-red-400" />
                              {key === "agreeToTerms" ? "You must agree to the terms of service" : (error as any).message}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="flex gap-4 pt-2">
                      <Button type="button" variant="outline" onClick={prevStep} className="h-12 flex-1 rounded-xl font-bold">Back</Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting} 
                        className="h-14 flex-[2] rounded-xl bg-gradient-to-br from-teal-500 to-teal-800 text-white font-black text-lg shadow-2xl shadow-teal-500/20 active:scale-[0.98] transition-transform"
                      >
                        {isSubmitting ? "Launching..." : "Launch My Profile 🚀"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </form>
        </div>
      </div>
    </div>
  )
}

/* ------------------- Helpers ------------------- */

function FloatingInput({ label, error, type = "text", ...props }: any) {
  const [focused, setFocused] = useState(false)
  const [hasValue, setHasValue] = useState(Boolean(props.value || props.defaultValue))
  const isDateInput = type === "date"
  const shouldFloat = focused || hasValue || isDateInput
  const { onChange: onChangeProp, onBlur: onBlurProp, ...restProps } = props
  
  return (
    <div className="relative">
      <div className={cn(
        "relative rounded-xl border transition-all",
        focused ? "border-teal-500 ring-4 ring-teal-50" : "border-gray-200",
        error ? "border-red-500 ring-red-50" : ""
      )}>
        <label className={cn(
          "absolute left-4 transition-all pointer-events-none uppercase font-black tracking-widest",
          shouldFloat ? "-top-2 bg-white px-1 text-[9px] text-teal-600" : "top-3.5 text-xs text-gray-400"
        )}>
          {label}
        </label>
        <input 
          type={type}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false)
            setHasValue(Boolean(e.target.value))
            onBlurProp?.(e)
          }}
          onChange={(e) => {
            setHasValue(Boolean(e.target.value))
            onChangeProp?.(e)
          }}
          className={cn(
            "h-12 w-full bg-transparent px-4 text-sm font-semibold outline-none text-[#0f172a]",
            shouldFloat ? "pt-3" : "",
            isDateInput ? "appearance-none" : ""
          )}
          {...restProps}
        />
        {error && <p className="absolute -bottom-5 left-0 text-[10px] font-bold text-red-500 uppercase">{error}</p>}
      </div>
    </div>
  )
}

function ExperienceCard({ title, desc, icon, active, onClick }: any) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-4 p-5 rounded-2xl border-2 text-left transition-all",
        active ? "border-teal-500 bg-teal-50 shadow-md translate-x-1" : "border-gray-100 bg-white hover:border-teal-100"
      )}
    >
      <div className={cn(
        "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
        active ? "bg-teal-500 text-white" : "bg-gray-50 text-teal-600"
      )}>
        {cloneElement(icon, { size: 24 })}
      </div>
      <div>
        <h4 className={cn("text-base font-black font-josefin", active ? "text-teal-900" : "text-[#0f172a]")}>{title}</h4>
        <p className={cn("text-xs font-medium", active ? "text-teal-700" : "text-gray-500")}>{desc}</p>
      </div>
    </button>
  )
}

function SkillSearch({ onAdd }: { onAdd: (s: string) => void }) {
  const [q, setQ] = useState("")
  const filtered = SKILLS_PRESET.filter(s => s.toLowerCase().includes(q.toLowerCase())).slice(0, 5)
  
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        <Search className="w-4 h-4" />
      </div>
      <input 
        className="h-12 w-full rounded-xl border border-gray-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-teal-500 ring-4 focus:ring-teal-50"
        placeholder="Search for skills (e.g. React, Python...)"
        value={q}
        onChange={e => setQ(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            e.preventDefault()
            const input = e.currentTarget.value.trim()
            if (input) {
              onAdd(input)
              setQ("")
            }
          }
        }}
      />
      {q && filtered.length > 0 && (
        <div className="absolute z-20 top-full left-0 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2">
          {filtered.map(s => (
            <button 
              key={s} type="button"
              className="w-full text-left px-4 py-3 text-sm font-bold text-gray-700 hover:bg-teal-50 hover:text-teal-700 transition-colors"
              onClick={() => { onAdd(s); setQ("") }}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function IconInput({ icon, ...props }: any) {
  return (
    <div className="relative group">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 opacity-60 group-focus-within:opacity-100 transition-opacity">
        {icon}
      </div>
      <input 
        className="h-12 w-full rounded-xl border border-gray-200 pl-11 pr-4 text-sm font-semibold outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-50"
        {...props}
      />
    </div>
  )
}

function CompletenessItem({ done, label }: { done: boolean, label: string }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
      done ? "bg-teal-500 text-white" : "bg-white text-gray-400 border border-gray-100"
    )}>
      {done ? <Check className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-200" />}
      {label}
    </div>
  )
}

import { cloneElement } from "react"
