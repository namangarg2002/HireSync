import { useEffect } from "react"
import { useAuth } from "@clerk/clerk-react"
import { attachTokenInterceptor } from "./lib/axios"

export default function AxiosProvider({ children }) {
  const { getToken } = useAuth()

  useEffect(() => {
    attachTokenInterceptor(getToken)
  }, [getToken])

  return children
}