import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Boxes, ArrowRight, ShieldCheck } from "lucide-react"
import { useAuth } from "./AuthContext"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ApiClientError } from "@/lib/api-client"

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError("Please enter both username and password.")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await login(username, password)
      navigate("/")
    } catch (err: any) {
      if (err instanceof ApiClientError) {
        setError(err.getFirstError())
      } else {
        setError("Invalid credentials. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md space-y-6"
      >
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Boxes className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-primary">Sign in to InvLab</h1>
          <p className="text-xs text-charcoal-muted">Modern Inventory & Sales Management Workspace</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-7 shadow-xs">
          {error && (
            <div className="mb-5 rounded-md border border-status-error-border bg-status-error-bg p-3 text-xs font-medium text-status-error-text">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              type="text"
              placeholder="e.g. demo"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              Sign in <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-charcoal-muted">
            New to InvLab?{" "}
            <Link to="/register" className="font-semibold text-primary hover:underline">
              Create an account
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-xs text-charcoal-muted/80">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          <span>Session secured with Django authentication</span>
        </div>
      </motion.div>
    </div>
  )
}
