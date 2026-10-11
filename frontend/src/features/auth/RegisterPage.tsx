import * as React from "react"
import { Link, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Boxes, ArrowRight } from "lucide-react"
import { useAuth } from "./AuthContext"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { ApiClientError } from "@/lib/api-client"

export function RegisterPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = React.useState({
    username: "",
    email: "",
    password: "",
    password_confirm: "",
  })
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({})
  const [generalError, setGeneralError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (fieldErrors[e.target.name]) {
      setFieldErrors((prev) => ({ ...prev, [e.target.name]: "" }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFieldErrors({})
    setGeneralError(null)

    if (formData.password !== formData.password_confirm) {
      setFieldErrors({ password_confirm: "Passwords do not match." })
      setIsLoading(false)
      return
    }

    try {
      await register(formData)
      navigate("/")
    } catch (err: any) {
      if (err instanceof ApiClientError && typeof err.data === "object") {
        const errors: Record<string, string> = {}
        for (const key of Object.keys(err.data)) {
          const val = err.data[key]
          errors[key] = Array.isArray(val) ? val.join(" ") : String(val)
        }
        setFieldErrors(errors)
      } else {
        setGeneralError("Registration failed. Please try again.")
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
          <h1 className="text-2xl font-bold tracking-tight text-primary">Create an Account</h1>
          <p className="text-xs text-charcoal-muted">Set up your InvLab staff workspace</p>
        </div>

        <div className="rounded-lg border border-border bg-surface p-7 shadow-xs">
          {generalError && (
            <div className="mb-5 rounded-md border border-status-error-border bg-status-error-bg p-3 text-xs font-medium text-status-error-text">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Username"
              name="username"
              type="text"
              placeholder="e.g. jdoe"
              value={formData.username}
              onChange={handleChange}
              error={fieldErrors.username}
              required
              autoFocus
            />

            <Input
              label="Email (optional)"
              name="email"
              type="email"
              placeholder="jdoe@example.com"
              value={formData.email}
              onChange={handleChange}
              error={fieldErrors.email}
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              error={fieldErrors.password}
              required
            />

            <Input
              label="Confirm Password"
              name="password_confirm"
              type="password"
              placeholder="••••••••"
              value={formData.password_confirm}
              onChange={handleChange}
              error={fieldErrors.password_confirm}
              required
            />

            <Button type="submit" className="w-full mt-2" isLoading={isLoading}>
              Create account <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </form>

          <div className="mt-6 border-t border-border pt-4 text-center text-xs text-charcoal-muted">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
