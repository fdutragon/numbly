"use client"

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */
import { useEffect, useRef, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import type { LexicalCommand, LexicalEditor, RangeSelection } from "lexical"
import {
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_EDITOR,
  createCommand,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical"
import { MicIcon } from "lucide-react"

import { useReport } from "@/components/editor/editor-hooks/use-report"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export const SPEECH_TO_TEXT_COMMAND: LexicalCommand<boolean> = createCommand(
  "SPEECH_TO_TEXT_COMMAND"
)

const VOICE_COMMANDS: Readonly<
  Record<
    string,
    (arg0: { editor: LexicalEditor; selection: RangeSelection }) => void
  >
> = {
  "\n": ({ selection }) => {
    selection.insertParagraph()
  },
  redo: ({ editor }) => {
    editor.dispatchCommand(REDO_COMMAND, undefined)
  },
  undo: ({ editor }) => {
    editor.dispatchCommand(UNDO_COMMAND, undefined)
  },
}

function SpeechToTextPluginImpl() {
  const [editor] = useLexicalComposerContext()
  const [isEnabled, setIsEnabled] = useState<boolean>(false)
  const [isSpeechToText, setIsSpeechToText] = useState<boolean>(false)
  const [isClient, setIsClient] = useState<boolean>(false)
  const [supportsSpeechRecognition, setSupportsSpeechRecognition] = useState<boolean>(false)
  const SpeechRecognition = useRef<
    typeof window.SpeechRecognition | typeof window.webkitSpeechRecognition | null
  >(null)
  const recognition = useRef<SpeechRecognition | null>(null)
  const report = useReport()

  // Garantir renderização apenas no cliente após hidratação
  useEffect(() => {
    setIsClient(true)
    const hasSupport = typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
    setSupportsSpeechRecognition(hasSupport)
    
    if (hasSupport) {
      // @ts-expect-error missing type
      SpeechRecognition.current = window.SpeechRecognition || window.webkitSpeechRecognition
    }
  }, [])

  useEffect(() => {
    if (!isClient || !supportsSpeechRecognition || !SpeechRecognition.current) {
      return
    }

    if (isEnabled && recognition.current === null) {
      recognition.current = new (
        SpeechRecognition.current as new () => SpeechRecognition
      )()
      recognition.current.continuous = true
      recognition.current.interimResults = true
      recognition.current.addEventListener(
        "result",
        (event: SpeechRecognitionEvent) => {
          const resultItem = event.results.item(event.resultIndex)
          const { transcript } = resultItem.item(0)
          report(transcript)

          if (!resultItem.isFinal) {
            return
          }

          editor.update(() => {
            const selection = $getSelection()

            if ($isRangeSelection(selection)) {
              const command = VOICE_COMMANDS[transcript.toLowerCase().trim()]

              if (command) {
                command({
                  editor,
                  selection,
                })
              } else if (transcript.match(/\s*\n\s*/)) {
                selection.insertParagraph()
              } else {
                selection.insertText(transcript)
              }
            }
          })
        }
      )
    }

    if (recognition.current) {
      if (isEnabled) {
        recognition.current.start()
      } else {
        recognition.current.stop()
      }
    }

    return () => {
      if (recognition.current !== null) {
        recognition.current.stop()
      }
    }
  }, [isClient, supportsSpeechRecognition, editor, isEnabled, report])
  useEffect(() => {
    return editor.registerCommand(
      SPEECH_TO_TEXT_COMMAND,
      (_isEnabled: boolean) => {
        setIsEnabled(_isEnabled)
        return true
      },
      COMMAND_PRIORITY_EDITOR
    )
  }, [editor])

  // Não renderizar durante SSR ou se não há suporte
  if (!isClient || !supportsSpeechRecognition) {
    return null
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => {
            editor.dispatchCommand(SPEECH_TO_TEXT_COMMAND, !isSpeechToText)
            setIsSpeechToText(!isSpeechToText)
          }}
          variant={isSpeechToText ? "secondary" : "ghost"}
          title="Speech To Text"
          aria-label={`${isSpeechToText ? "Disable" : "Enable"} speech to text`}
          className="p-2"
          size={"sm"}
        >
          <MicIcon className="size-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>Speech To Text</TooltipContent>
    </Tooltip>
  )
}

export const SpeechToTextPlugin = SpeechToTextPluginImpl
