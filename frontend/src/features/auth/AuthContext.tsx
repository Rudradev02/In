import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { type User } from "@/lib/types"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<User>
  register: (payload: { username: string; password: string; password_confirm: string; email?: string }) => Promise<User>
  logout: () => Promise<void>
  refetchUser: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  const fetchUser = React.useCallback(async () => {
    try {
      // Ensure CSRF token is initiated
      await apiClient.get<{ csrfToken: string }>("/auth/csrf/").catch(() => {})
      const currentUser = await apiClient.get<User>("/auth/me/")
      setUser(currentUser)
    } catch (err) {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const login = async (username: string, password: string) => {
    const loggedInUser = await apiClient.post<User>("/auth/login/", { username, password })
    setUser(loggedInUser)
    return loggedInUser
  }

  const register = async (payload: { username: string; password: string; password_confirm: string; email?: string }) => {
    const newUser = await apiClient.post<User>("/auth/register/", payload)
    setUser(newUser)
    return newUser
  }

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout/")
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refetchUser: fetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = React.useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
