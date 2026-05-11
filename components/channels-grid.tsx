"use client"

import { useState, useEffect } from "react"
import { Search, Tv, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"

export function ChannelsGrid() {
  const [channels, setChannels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  const fetchChannels = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/xtream?action=get_live_streams")
      const data = await response.json()
      setChannels(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error("Erro ao buscar canais:", error)
      toast.error("Erro ao carregar canais")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchChannels()
  }, [])

  const filteredChannels = channels.filter(item => 
    (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 60)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Canais ao Vivo</h2>
          <p className="text-muted-foreground">
            Visualize a grade de canais disponíveis ({channels.length} totais)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={fetchChannels} disabled={loading}>
            <RefreshCw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          </Button>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar canal..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {Array.from({ length: 18 }).map((_, i) => (
            <Skeleton key={i} className="aspect-video w-full rounded-lg" />
          ))}
        </div>
      ) : filteredChannels.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Tv className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium">Nenhum canal encontrado</h3>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {filteredChannels.map((item) => (
            <Card key={item.stream_id || item.num} className="group overflow-hidden border-border/40 bg-muted/5 hover:border-primary/50 transition-all duration-200">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {item.stream_icon ? (
                    <img
                      src={item.stream_icon}
                      alt={item.name}
                      className="object-contain w-full h-full p-2 group-hover:scale-110 transition-transform"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "https://placehold.co/200x120/121212/white?text=Canal"
                      }}
                    />
                  ) : (
                    <Tv className="h-6 w-6 text-muted-foreground/30" />
                  )}
                  <div className="absolute top-1 right-1">
                    <Badge className="text-[8px] h-3.5 px-1 bg-primary/80">LIVE</Badge>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-[10px] font-medium truncate text-center group-hover:text-primary transition-colors">
                    {item.name}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
