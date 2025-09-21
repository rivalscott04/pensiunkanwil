import { Link } from "react-router-dom"
import { FileText, Users, Shield, ArrowRight } from "lucide-react"
import { AppButton } from "@/components/ui/app-button"
import { AppHeading, AppText } from "@/components/ui/app-typography"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HeroIllustration } from "@/components/illustrations/HeroIllustration"
import { ThemeToggle } from "@/components/ui/theme-toggle"

const Index = () => {
  const features = [
    {
      icon: FileText,
      title: "Pengajuan Pensiun Digital",
      description: "Kelola pengajuan pensiun secara online dengan mudah dan cepat"
    },
    {
      icon: Users,
      title: "Manajemen Pegawai",
      description: "Kelola data pegawai dan tracking status pensiun"
    },
    {
      icon: Shield,
      title: "Keamanan Data",
      description: "Sistem aman dengan enkripsi tingkat tinggi"
    }
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-primary/10 min-h-[90vh] flex items-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left content */}
            <div className="text-left space-y-8">
              <div className="space-y-4">
                <AppHeading level={1} className="text-4xl lg:text-6xl font-bold animate-fade-in">
                  Sistem Pengajuan
                  <span className="block text-primary">Pensiun Digital</span>
                </AppHeading>
                <AppText size="xl" color="muted" className="max-w-xl animate-fade-in">
                  Platform modern untuk mengelola pengajuan pensiun secara digital. 
                  Mudah, cepat, dan aman untuk semua jenis pensiun.
                </AppText>
              </div>
              
              <div className="flex justify-start animate-fade-in">
                <AppButton variant="hero" size="xl" asChild className="hover:shadow-hover hover:scale-105 transition-all duration-300">
                  <Link to="/login">
                    Masuk Sistem
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </AppButton>
              </div>
            </div>
            
            {/* Right illustration */}
            <div className="relative animate-fade-in">
              <div className="absolute inset-0 bg-gradient-primary rounded-3xl opacity-5 blur-3xl"></div>
              <div className="relative">
                <HeroIllustration className="w-full max-w-lg mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <AppHeading level={2} className="mb-4">
              Fitur Unggulan
            </AppHeading>
            <AppText size="lg" color="muted" className="max-w-2xl mx-auto">
              Sistem yang dirancang khusus untuk memudahkan proses pengajuan dan pengelolaan pensiun
            </AppText>
          </div>
          
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <Card 
                  key={index}
                  className="text-center group hover:shadow-hover hover:-translate-y-2 transition-all duration-300 animate-fade-in cursor-pointer"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader>
                    <div className="bg-gradient-primary p-4 rounded-full inline-flex mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <CardTitle className="text-xl">
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>


      {/* Call to Action */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AppHeading level={2} color="white" className="mb-4">
            Siap Mengelola Sistem Pensiun?
          </AppHeading>
          <AppText size="lg" color="white" className="mb-8 max-w-2xl mx-auto">
            Akses dashboard untuk mengelola pengajuan pensiun dengan efisien dan aman
          </AppText>
          <AppButton variant="secondary" size="xl" asChild>
            <Link to="/login">
              Masuk Dashboard
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </AppButton>
        </div>
      </section>

    </div>
  );
};

export default Index;
