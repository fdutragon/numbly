"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface ClauseInsertDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onInsert: (clauseText: string) => void
}

export function ClauseInsertDialog({
  open,
  onOpenChange,
  onInsert,
}: ClauseInsertDialogProps) {
  const [clauseText, setClauseText] = useState("")

  const handleInsert = () => {
    if (clauseText.trim()) {
      onInsert(clauseText.trim())
      setClauseText("")
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    setClauseText("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Inserir Cláusula Personalizada</DialogTitle>
          <DialogDescription>
            Digite o texto da cláusula que deseja inserir no contrato.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="clause-text">Texto da Cláusula</Label>
            <Textarea
              id="clause-text"
              placeholder="Digite aqui o texto da cláusula..."
              value={clauseText}
              onChange={(e) => setClauseText(e.target.value)}
              className="min-h-[200px] resize-none border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg p-4 text-sm leading-relaxed"
              autoFocus
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button 
            onClick={handleInsert} 
            disabled={!clauseText.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Inserir Cláusula
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}