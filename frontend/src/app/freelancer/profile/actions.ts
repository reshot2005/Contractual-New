"use server"

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Role } from "@prisma/client"
import { computeProfileCompleteness } from "@/lib/profile-completeness"

// Helper to update profile completeness
async function updateCompleteness(userId: string) {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    include: { skills: true, portfolio: true, education: true, experience: true, certifications: true, languages: true }
  })
  if (u) {
    await prisma.user.update({
      where: { id: userId },
      data: { profileComplete: computeProfileCompleteness(u as any) }
    })
  }
}

export async function addSkill(name: string, level: string = "Expert") {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  await prisma.skill.create({
    data: { name, level, userId: session.user.id }
  })
  await updateCompleteness(session.user.id)
  return { success: true }
}

export async function removeSkill(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  await prisma.skill.delete({ where: { id } })
  await updateCompleteness(session.user.id)
  return { success: true }
}

export async function addPortfolio(
  title: string,
  description: string,
  url: string,
  imageUrl?: string | null
) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  await prisma.portfolio.create({
    data: {
      title,
      description,
      url,
      imageUrl: imageUrl || null,
      userId: session.user.id,
    },
  })
  await updateCompleteness(session.user.id)
  return { success: true }
}

export async function addExperience(title: string, company: string, startYear: number, endYear: number | null, location: string, description: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  await prisma.experience.create({
    data: { 
      title, 
      company, 
      startYear, 
      endYear, 
      current: !endYear,
      location,
      description,
      userId: session.user.id 
    }
  })
  await updateCompleteness(session.user.id)
  return { success: true }
}

export async function addEducation(institution: string, degree: string, field: string, startYear: number, endYear: number | null) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  
  await prisma.education.create({
    data: { 
      institution, 
      degree, 
      field,
      startYear, 
      endYear, 
      userId: session.user.id 
    }
  })
  await updateCompleteness(session.user.id)
  return { success: true }
}

export async function removeExperience(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  await prisma.experience.delete({ where: { id } })
  await updateCompleteness(session.user.id)
  return { success: true }
}

export async function removeEducation(id: string) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  await prisma.education.delete({ where: { id } })
  await updateCompleteness(session.user.id)
  return { success: true }
}
