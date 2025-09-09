import { useState } from "react"
import { Link } from "react-router-dom"
import { Eye, EyeOff, User, Lock } from "lucide-react"
import { AppButton } from "@/components/ui/app-button"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoginIllustration } from "@/components/illustrations/LoginIllustration"
import { ThemeToggle } from "@/components/ui/theme-toggle"

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL || ''}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: formData.username, password: formData.password })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.message || 'Login gagal')
      // store token (for Authorization header fallback)
      try { localStorage.setItem('auth_token', json?.data?.token || '') } catch {}
      // redirect
      window.location.href = '/dashboard'
    } catch (err) {
      setLoading(false)
      alert((err as Error).message)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="min-h-screen flex">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Left side - Illustration */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/10 to-primary/5 relative overflow-hidden">
        <div className="relative z-10 flex flex-col justify-center items-center p-12">
          <div className="max-w-md text-center space-y-8">
            <div className="relative">
              <LoginIllustration className="w-full max-w-sm mx-auto" />
            </div>
            
            <div className="space-y-4">
              <AppHeading level={2} className="text-primary">
                Sistem Pensiun Digital
              </AppHeading>
              <AppText size="lg" color="muted">
                Platform terpercaya untuk mengelola pengajuan pensiun secara digital dengan mudah dan aman.
              </AppText>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">✓</span>
                </div>
                <AppText>Proses cepat dan mudah</AppText>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">✓</span>
                </div>
                <AppText>Data aman dan terenkripsi</AppText>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">✓</span>
                </div>
                <AppText>Tracking real-time</AppText>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-8 bg-background">
        <div className="max-w-md w-full mx-auto">
          <Card className="shadow-modal">
            <CardHeader className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
                  <AppText size="lg" weight="bold" color="white">SP</AppText>
                </div>
              </div>
              <div className="space-y-2">
                <AppHeading level={2}>
                  Masuk ke Sistem
                </AppHeading>
                <AppText color="muted">
                  Silakan masuk dengan akun resmi Anda
                </AppText>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">Email</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    name="username"
                    type="email"
                    required
                    placeholder="Masukkan email"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="Masukkan password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember"
                  name="remember"
                  type="checkbox"
                  className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
                />
                <Label htmlFor="remember" className="ml-2">
                  Ingat saya
                </Label>
              </div>
              <AppText size="sm" color="primary" className="hover:underline cursor-pointer">
                Lupa password?
              </AppText>
            </div>

                <AppButton
                  type="submit"
                  className="w-full hover:shadow-button hover:scale-105 transition-all duration-300"
                  size="lg"
                  loading={loading}
                  variant="hero"
                >
                  Masuk
                </AppButton>

              </form>

              <div className="mt-6 text-center">
                <AppText size="xs" color="muted">
                  Dengan masuk, Anda menyetujui{" "}
                  <span className="text-primary hover:underline cursor-pointer">
                    Syarat dan Ketentuan
                  </span>{" "}
                  serta{" "}
                  <span className="text-primary hover:underline cursor-pointer">
                    Kebijakan Privasi
                  </span>
                </AppText>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}