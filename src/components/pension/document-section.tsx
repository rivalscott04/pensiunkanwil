import * as React from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { AppText, AppHeading } from "@/components/ui/app-typography"
import { CheckCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface DocumentSectionProps {
  title: string
  description: string
  completed: number
  total: number
  children: React.ReactNode
  className?: string
}

export function DocumentSection({ 
  title, 
  description, 
  completed, 
  total, 
  children, 
  className 
}: DocumentSectionProps) {
  const isComplete = completed === total
  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <Card className={cn("border-border shadow-card", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <AppHeading level={4} className="text-base">
                {title}
              </AppHeading>
              {isComplete && (
                <div className="p-1 bg-success text-success-foreground rounded-full">
                  <CheckCircle className="w-3 h-3" />
                </div>
              )}
            </div>
            <AppText size="sm" color="muted">
              {description}
            </AppText>
          </div>
          <div className="text-right">
            <AppText size="sm" weight="semibold" className={cn(
              isComplete ? "text-success" : "text-muted-foreground"
            )}>
              {completed}/{total}
            </AppText>
            <AppText size="xs" color="muted">
              {progressPercentage}% selesai
            </AppText>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div 
            className={cn(
              "h-full transition-all duration-700 ease-out",
              isComplete 
                ? "bg-success" 
                : "bg-gradient-to-r from-orange-500 to-orange-400"
            )}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  )
}