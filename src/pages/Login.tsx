import { useState, useRef, useEffect } from "react"
import { Link } from "react-router-dom"
import { Eye, EyeOff, User, Lock, AlertCircle, X } from "lucide-react"
import { AppButton } from "@/components/ui/app-button"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoginIllustration } from "@/components/illustrations/LoginIllustration"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { API_BASE_URL } from "@/lib/api"

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: ""
  })
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  })
  const [emailTouched, setEmailTouched] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)
  const passwordRef = useRef<HTMLInputElement>(null)

  // Real-time email validation
  const validateEmail = (email: string) => {
    if (!email.trim()) {
      return "Email wajib diisi"
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return "Format email tidak valid"
    }
    return ""
  }

  const validatePassword = (password: string) => {
    if (!password) {
      return "Password wajib diisi"
    }
    return ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setServerError("")
    
    // Clear previous field errors
    setFieldErrors({ email: "", password: "" })
    
    const email = formData.username.trim()
    const password = formData.password
    
    // Validate fields
    const emailError = validateEmail(email)
    const passwordError = validatePassword(password)
    
    if (emailError || passwordError) {
      setFieldErrors({
        email: emailError,
        password: passwordError
      })
      
      // Focus on first error field
      if (emailError) {
        emailRef.current?.focus()
      } else if (passwordError) {
        passwordRef.current?.focus()
      }
      return
    }
    
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (res.status === 401 || res.status === 422) {
          setServerError('Email dan password tidak sesuai. Silakan cek kembali.')
          passwordRef.current?.focus()
          return
        }
        if (res.status === 419) {
          setServerError('Session expired. Silakan refresh halaman dan coba lagi.')
          return
        }
        setServerError('Terjadi kendala saat masuk. Silakan coba lagi beberapa saat.')
        return
      }
      // store token (for Authorization header fallback)
      try { localStorage.setItem('auth_token', json?.data?.token || '') } catch {}
      // redirect
      window.location.href = '/dashboard'
    } catch (err) {
      setServerError('Terjadi kendala jaringan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // Clear field error when user starts typing
    if (fieldErrors[name as keyof typeof fieldErrors]) {
      setFieldErrors(prev => ({
        ...prev,
        [name]: ""
      }))
    }
    
    // Clear server error when user starts typing
    if (serverError) {
      setServerError("")
    }
    
    // Real-time email validation
    if (name === "username") {
      setEmailTouched(true)
      if (emailTouched) {
        const emailError = validateEmail(value)
        if (emailError) {
          setFieldErrors(prev => ({
            ...prev,
            email: emailError
          }))
        }
      }
    }
  }

  const handleEmailBlur = () => {
    setEmailTouched(true)
    const emailError = validateEmail(formData.username)
    setFieldErrors(prev => ({
      ...prev,
      email: emailError
    }))
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
                {/* Server Error Banner */}
                {serverError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm text-red-800">{serverError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setServerError("")}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="username">Email</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={emailRef}
                        id="username"
                        name="username"
                        type="email"
                        required
                        placeholder="Masukkan email"
                        value={formData.username}
                        onChange={handleInputChange}
                        onBlur={handleEmailBlur}
                        className={`pl-10 ${fieldErrors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      {fieldErrors.email && (
                        <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {fieldErrors.email && (
                      <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{fieldErrors.email}</span>
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={passwordRef}
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        required
                        placeholder="Masukkan password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className={`pl-10 pr-10 ${fieldErrors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-10 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {fieldErrors.password && (
                        <AlertCircle className="absolute right-3 top-3 h-4 w-4 text-red-500" />
                      )}
                    </div>
                    {fieldErrors.password && (
                      <p className="mt-1 text-sm text-red-600 flex items-center space-x-1">
                        <AlertCircle className="h-3 w-3" />
                        <span>{fieldErrors.password}</span>
                      </p>
                    )}
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