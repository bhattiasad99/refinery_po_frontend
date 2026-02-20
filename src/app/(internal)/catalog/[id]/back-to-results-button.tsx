"use client"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"

type BackToResultsButtonProps = {
  fallbackHref: string
}

export function BackToResultsButton({ fallbackHref }: BackToResultsButtonProps) {
  const router = useRouter()

  function handleBack() {
    router.push(fallbackHref)
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={handleBack} className="w-fit">
      <ArrowLeft className="size-4" />
      Back to results
    </Button>
  )
}
