"use client"

import { useState } from "react"
import { $createParagraphNode, $createTextNode, $getSelection, $insertNodes } from "lexical"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { FileTextIcon } from "lucide-react"
import { SelectItem } from "@/components/ui/select"
import { ClauseInsertDialog } from "@/components/editor/dialogs/clause-insert-dialog"

export function InsertClause() {
  const [editor] = useLexicalComposerContext()
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleInsertClause = (clauseText: string) => {
    editor.update(() => {
      const selection = $getSelection()
      if (selection) {
        const paragraphNode = $createParagraphNode()
        const textNode = $createTextNode(clauseText)
        paragraphNode.append(textNode)
        $insertNodes([paragraphNode])
      }
    })
  }

  return (
    <>
      <SelectItem
        value="clause"
        className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
        onSelect={() => setDialogOpen(true)}
      >
        <FileTextIcon className="size-4" />
        <span>Inserir Cláusula</span>
      </SelectItem>
      <ClauseInsertDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onInsert={handleInsertClause}
      />
    </>
  )
}