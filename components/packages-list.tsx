"use client"

import { useState, useEffect } from "react"
import { Package, RefreshCw, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export function PackagesList() {
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPackages = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/xtream?action=get_packages")
      const data = await response.json()
      setPackages(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao buscar pacotes:", error)
      toast.error("Erro ao carregar pacotes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPackages()
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pacotes Disponíveis</h2>
          <p className="text-muted-foreground">
            Visualize os pacotes de canais e conteúdos que você pode vender
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchPackages} disabled={loading}>
          <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Nenhum pacote configurado</h3>
          <p className="text-muted-foreground">Os pacotes são gerenciados no painel Master do Xtream UI.</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {packages.map((pkg) => (
            <Card key={pkg.id} className="border-border/50 hover:border-primary/40 transition-all group shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
                    <Package className="h-5 w-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="font-mono">ID: {pkg.id}</Badge>
                </div>
                <CardTitle className="text-xl mt-3">{pkg.package_name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {pkg.trial_credits ? `${pkg.trial_credits} Créditos por teste` : "Pacote de conteúdo padrão"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      Acesso a Canais Live
                   </div>
                   <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      VOD (Filmes e Séries)
                   </div>
                </div>
                <Button variant="outline" className="w-full">Ver Conteúdo</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
