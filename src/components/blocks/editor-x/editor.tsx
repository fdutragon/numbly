"use client"

import React, { memo } from "react"
import "@/styles/contract-styles.css"
import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { EditorState, SerializedEditorState } from "lexical"

import { FloatingLinkContext } from "@/components/editor/context/floating-link-context"
import { SharedAutocompleteContext } from "@/components/editor/context/shared-autocomplete-context"
import { editorTheme } from "@/components/editor/themes/editor-theme"
import { TooltipProvider } from "@/components/ui/tooltip"

import { nodes } from "./nodes"

// Lazy load plugins para melhor performance
import { Plugins } from "./plugins"

const editorConfig: InitialConfigType = {
  namespace: "Editor",
  theme: editorTheme,
  nodes,
  onError: (error: Error) => {
    console.error(error)
  },
}

export const Editor = memo(function Editor({
  editorState,
  editorSerializedState,
  initialValue,
  onChange,
  onSerializedChange,
  className,
}: {
  editorState?: EditorState
  editorSerializedState?: SerializedEditorState
  initialValue?: SerializedEditorState
  onChange?: (editorState: SerializedEditorState) => void
  onSerializedChange?: (editorSerializedState: SerializedEditorState) => void
  className?: string
}) {
  const initialEditorState = editorState || 
    (editorSerializedState ? JSON.stringify(editorSerializedState) : 
    (initialValue ? JSON.stringify(initialValue) : undefined));

  return (
    <div className={`bg-background overflow-hidden ${className || ''}`}>
      <LexicalComposer
        initialConfig={{
          ...editorConfig,
          ...(initialEditorState ? { editorState: initialEditorState } : {}),
        }}
      >
        <TooltipProvider>
          <SharedAutocompleteContext>
            <FloatingLinkContext>
              <Plugins />

              <OnChangePlugin
                ignoreSelectionChange={true}
                onChange={(editorState) => {
                  const serializedState = editorState.toJSON();
                  onChange?.(serializedState);
                  onSerializedChange?.(serializedState);
                }}
              />
            </FloatingLinkContext>
          </SharedAutocompleteContext>
        </TooltipProvider>
      </LexicalComposer>
    </div>
  )
})

Editor.displayName = 'Editor'
