import { createUploadthing, type FileRouter, UploadThingError } from "uploadthing/server"
import { auth } from "./auth"

const f = createUploadthing()

async function getSessionOrThrow() {
  const session = await auth()
  if (!session?.user?.id) throw new UploadThingError("Unauthorized")
  return { userId: session.user.id, role: session.user.role }
}

export const uploadRouter = {
  gigAttachments: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 10 },
    image: { maxFileSize: "16MB", maxFileCount: 10 },
    blob: { maxFileSize: "16MB", maxFileCount: 10 },
  })
    .middleware(async () => await getSessionOrThrow())
    .onUploadComplete(() => {}),

  submissionFiles: f({
    blob: { maxFileSize: "32MB", maxFileCount: 20 },
  })
    .middleware(async () => await getSessionOrThrow())
    .onUploadComplete(() => {}),

  avatars: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .onUploadComplete(() => {}),

  portfolioFiles: f({
    image: { maxFileSize: "8MB", maxFileCount: 12 },
  })
    .onUploadComplete(() => {}),

  gigBanner: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async () => await getSessionOrThrow())
    .onUploadComplete(() => {}),
} satisfies FileRouter

export type OurFileRouter = typeof uploadRouter
