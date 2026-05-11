"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Plus, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"

const formSchema = z.object({
  username: z.string().min(3, {
    message: "Usuário deve ter pelo menos 3 caracteres.",
  }),
  password: z.string().min(4, {
    message: "Senha deve ter pelo menos 4 caracteres.",
  }),
  package_id: z.string({
    required_error: "Selecione um pacote.",
  }),
  max_connections: z.string().default("1"),
})

export function CreateLineDialog({ onLineCreated }: { onLineCreated?: () => void }) {
  const [open, setOpen] = useState(false)
  const [packages, setPackages] = useState<any[]>([])
  const [isLoadingPackages, setIsLoadingPackages] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
      max_connections: "1",
    },
  })

  // Busca pacotes quando o diálogo abrir
  useEffect(() => {
    if (open) {
      loadPackages()
    }
  }, [open])

  async function loadPackages() {
    setIsLoadingPackages(true)
    try {
      const response = await fetch("/api/xtream?action=get_packages")
      const data = await response.json()
      if (Array.isArray(data)) {
        setPackages(data)
      } else {
        console.error("Formato de pacotes inválido:", data)
      }
    } catch (error) {
      toast.error("Erro ao carregar pacotes")
    } finally {
      setIsLoadingPackages(false)
    }
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/xtream?action=create_line", {
        method: "GET", // A API do Alessandro usa GET com query params
        headers: {
          "Content-Type": "application/json",
        },
      })
      
      // Como a API usa GET, precisamos passar os parâmetros na URL
      const params = new URLSearchParams({
        action: "create_line",
        username: values.username,
        password: values.password,
        package_id: values.package_id,
        max_connections: values.max_connections,
      })
      
      const res = await fetch(`/api/xtream?${params.toString()}`)
      const result = await res.json()

      if (result.status === "STATUS_SUCCESS" || result.success) {
        toast.success("Linha criada com sucesso!")
        setOpen(false)
        form.reset()
        if (onLineCreated) onLineCreated()
      } else {
        toast.error(result.error || "Erro ao criar linha")
      }
    } catch (error) {
      toast.error("Erro na comunicação com o servidor")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nova Linha
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Criar Nova Linha</DialogTitle>
          <DialogDescription>
            Preencha os dados abaixo para gerar um novo acesso.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usuário</FormLabel>
                  <FormControl>
                    <Input placeholder="ex: cliente123" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Senha</FormLabel>
                  <FormControl>
                    <Input placeholder="••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="package_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Pacote</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={isLoadingPackages ? "Carregando..." : "Selecione um pacote"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {packages.map((pkg) => (
                        <SelectItem key={pkg.id} value={pkg.id.toString()}>
                          {pkg.package_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="max_connections"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Conexões Simultâneas</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="1" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 Conexão</SelectItem>
                      <SelectItem value="2">2 Conexões</SelectItem>
                      <SelectItem value="3">3 Conexões</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
                {form.formState.isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  "Gerar Acesso"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
