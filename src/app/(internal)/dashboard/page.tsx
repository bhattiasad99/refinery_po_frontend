import DashboardPageComponent from '@/components/use-case/DashboardPageComponent'
import React from 'react'
import { apiFetch } from '@/lib/api-fetch'

type GatewayEnvelope = {
  status?: number
  error?: boolean
  message?: string
  body?: {
    ok?: boolean
  } | null
}

const Dashboard = async () => {
  let protectedCheck = {
    ok: false,
    status: 0,
    message: "Protected API call failed.",
  }

  try {
    const response = await apiFetch("/catalog/health")
    const parsed = (await response.json()) as GatewayEnvelope

    protectedCheck = {
      ok: Boolean(parsed?.body?.ok) && response.ok,
      status: response.status,
      message: parsed?.message || (response.ok ? "Success" : "Request failed"),
    }
  } catch {
    protectedCheck = {
      ok: false,
      status: 0,
      message: "Could not reach gateway from dashboard check.",
    }
  }

  return (
   <DashboardPageComponent protectedCheck={protectedCheck} />
  )
}

export default Dashboard
