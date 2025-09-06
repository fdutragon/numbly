"use client"

import { useState, useEffect } from "react"
import { AlertCircle, CheckCircle, Settings } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface OpenAIStatusProps {
  className?: string
}

export function OpenAIStatus({ className }: OpenAIStatusProps) {
  const [isConfigured, setIsConfigured] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAPIStatus()
  }, [])

  const checkAPIStatus = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: 'test',
          context: 'test'
        }),
      })

      const data = await response.json()
      setIsConfigured(!data.fallback)
    } catch (error) {
      setIsConfigured(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-muted-foreground ${className}`}>
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
        Verificando configuração...
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {isConfigured ? (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <CheckCircle className="h-4 w-4" />
          <span>IA Ativa</span>
        </div>
      ) : (
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <span>Configurar IA</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurar OpenAI
              </DialogTitle>
              <DialogDescription>
                Configure sua chave da API do OpenAI para ativar o autocomplete inteligente.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <strong>Passos para configurar:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Acesse <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">platform.openai.com/api-keys</a></li>
                      <li>Crie uma nova chave de API</li>
                      <li>Abra o arquivo <code className="bg-muted px-1 rounded">.env.local</code> na raiz do projeto</li>
                      <li>Substitua <code className="bg-muted px-1 rounded">your_openai_api_key_here</code> pela sua chave</li>
                      <li>Reinicie o servidor de desenvolvimento</li>
                    </ol>
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={checkAPIStatus} variant="outline">
                  Verificar Novamente
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}