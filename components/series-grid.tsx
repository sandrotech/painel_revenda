"use client"

import { useState, useEffect } from "react"
import { Search, PlayCircle, Loader2, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export function SeriesGrid() {
  const [series, setSeries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchSeries = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/xtream?action=get_series")
      const data = await response.json()
      setSeries(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao buscar séries:", error)
      toast.error("Erro ao carregar catálogo de séries")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSeries()
  }, [])

  const filteredSeries = series.filter(item => 
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Catálogo de Séries</h2>
          <p className="text-muted-foreground">
            Explore as séries disponíveis ({series.length} totais)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchSeries} disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar série..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[2/3] w-full rounded-xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredSeries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <PlayCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Nenhuma série encontrada</h3>
          <p className="text-muted-foreground">Tente um termo de busca diferente ou atualize a lista.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredSeries.map((item) => (
            <Card key={item.series_id || item.num} className="group overflow-hidden border-border/40 bg-muted/5 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-primary/10">
              <div className="relative aspect-[2/3] overflow-hidden">
                {item.cover ? (
                  <img
                    src={item.cover}
                    alt={item.name}
                    className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "https://placehold.co/400x600/121212/white?text=Sem+Capa"
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <PlayCircle className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                   <Button size="sm" className="w-full h-8 text-xs font-bold">Ver Episódios</Button>
                </div>
              </div>
              <CardContent className="p-3">
                <p className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
                  {item.name}
                </p>
                <div className="flex items-center justify-between mt-1.5">
                  <Badge variant="outline" className="text-[10px] h-4 px-1.5 font-normal">
                    {item.releaseDate?.split("-")[0] || "SÉRIE"}
                  </Badge>
                  {item.rating && (
                    <span className="text-[10px] text-amber-500 font-bold flex items-center gap-0.5">
                      ★ {item.rating}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
