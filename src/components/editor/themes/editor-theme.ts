import { EditorThemeClasses } from "lexical"

import "./editor-theme.css"

export const editorTheme: EditorThemeClasses = {
  ltr: "text-left",
  rtl: "text-right",
  heading: {
    h1: "scroll-m-20 text-5xl font-bold tracking-tight lg:text-6xl text-foreground/95 leading-tight mb-8 mt-12 first:mt-0",
    h2: "scroll-m-20 border-b border-border/50 pb-3 text-4xl font-semibold tracking-tight text-foreground/90 leading-snug mb-6 mt-10 first:mt-0",
    h3: "scroll-m-20 text-3xl font-semibold tracking-tight text-foreground/90 leading-snug mb-4 mt-8",
    h4: "scroll-m-20 text-2xl font-medium tracking-tight text-foreground/85 leading-relaxed mb-3 mt-6",
    h5: "scroll-m-20 text-xl font-medium tracking-tight text-foreground/85 leading-relaxed mb-3 mt-5",
    h6: "scroll-m-20 text-lg font-medium tracking-tight text-foreground/80 leading-relaxed mb-2 mt-4",
  },
  paragraph: "leading-relaxed text-foreground/80 [&:not(:first-child)]:mt-4 mb-4 text-base font-normal tracking-wide",
  quote: "mt-6 mb-6 border-l-4 border-primary/30 pl-6 italic text-foreground/75 bg-muted/30 py-4 rounded-r-lg font-medium leading-relaxed",
  link: "text-primary hover:text-primary/80 underline-offset-4 hover:underline transition-colors duration-200 font-medium",
  list: {
    checklist: "relative",
    listitem: "mx-8",
    listitemChecked:
      'relative mx-2 px-6 list-none outline-none line-through before:content-[""] before:w-4 before:h-4 before:top-0.5 before:left-0 before:cursor-pointer before:block before:bg-cover before:absolute before:border before:border-primary before:rounded before:bg-primary before:bg-no-repeat after:content-[""] after:cursor-pointer after:border-white after:border-solid after:absolute after:block after:top-[6px] after:w-[3px] after:left-[7px] after:right-[7px] after:h-[6px] after:rotate-45 after:border-r-2 after:border-b-2 after:border-l-0 after:border-t-0',
    listitemUnchecked:
      'relative mx-2 px-6 list-none outline-none before:content-[""] before:w-4 before:h-4 before:top-0.5 before:left-0 before:cursor-pointer before:block before:bg-cover before:absolute before:border before:border-primary before:rounded',
    nested: {
      listitem: "list-none before:hidden after:hidden",
    },
    ol: "m-0 p-0 list-decimal [&>li]:mt-2",
    olDepth: [
      "list-outside !list-decimal",
      "list-outside !list-[upper-roman]",
      "list-outside !list-[lower-roman]",
      "list-outside !list-[upper-alpha]",
      "list-outside !list-[lower-alpha]",
    ],
    ul: "m-0 p-0 list-outside [&>li]:mt-2",
    ulDepth: [
      "list-outside !list-disc",
      "list-outside !list-disc",
      "list-outside !list-disc",
      "list-outside !list-disc",
      "list-outside !list-disc",
    ],
  },
  hashtag: "text-blue-600 bg-blue-100 rounded-md px-1",
  text: {
    bold: "font-bold",
    code: "bg-gray-100 p-1 rounded-md",
    italic: "italic",
    strikethrough: "line-through",
    subscript: "sub",
    superscript: "sup",
    underline: "underline",
    underlineStrikethrough: "underline line-through",
  },
  image: "relative inline-block user-select-none cursor-default editor-image",
  inlineImage:
    "relative inline-block user-select-none cursor-default inline-editor-image",
  keyword: "text-purple-900 font-bold",
  code: "EditorTheme__code",
  codeHighlight: {
    atrule: "EditorTheme__tokenAttr",
    attr: "EditorTheme__tokenAttr",
    boolean: "EditorTheme__tokenProperty",
    builtin: "EditorTheme__tokenSelector",
    cdata: "EditorTheme__tokenComment",
    char: "EditorTheme__tokenSelector",
    class: "EditorTheme__tokenFunction",
    "class-name": "EditorTheme__tokenFunction",
    comment: "EditorTheme__tokenComment",
    constant: "EditorTheme__tokenProperty",
    deleted: "EditorTheme__tokenProperty",
    doctype: "EditorTheme__tokenComment",
    entity: "EditorTheme__tokenOperator",
    function: "EditorTheme__tokenFunction",
    important: "EditorTheme__tokenVariable",
    inserted: "EditorTheme__tokenSelector",
    keyword: "EditorTheme__tokenAttr",
    namespace: "EditorTheme__tokenVariable",
    number: "EditorTheme__tokenProperty",
    operator: "EditorTheme__tokenOperator",
    prolog: "EditorTheme__tokenComment",
    property: "EditorTheme__tokenProperty",
    punctuation: "EditorTheme__tokenPunctuation",
    regex: "EditorTheme__tokenVariable",
    selector: "EditorTheme__tokenSelector",
    string: "EditorTheme__tokenSelector",
    symbol: "EditorTheme__tokenProperty",
    tag: "EditorTheme__tokenProperty",
    url: "EditorTheme__tokenOperator",
    variable: "EditorTheme__tokenVariable",
  },
  characterLimit: "!bg-destructive/50",
  table: "EditorTheme__table w-fit overflow-scroll border-collapse",
  tableCell:
    'EditorTheme__tableCell w-24 relative border px-4 py-2 text-left [&[align=center]]:text-center [&[align=right]]:text-right"',
  tableCellActionButton:
    "EditorTheme__tableCellActionButton bg-background block border-0 rounded-2xl w-5 h-5 text-foreground cursor-pointer",
  tableCellActionButtonContainer:
    "EditorTheme__tableCellActionButtonContainer block right-1 top-1.5 absolute z-10 w-5 h-5",
  tableCellEditing: "EditorTheme__tableCellEditing rounded-sm shadow-sm",
  tableCellHeader:
    "EditorTheme__tableCellHeader bg-muted border px-4 py-2 text-left font-bold [&[align=center]]:text-center [&[align=right]]:text-right",
  tableCellPrimarySelected:
    "EditorTheme__tableCellPrimarySelected border border-primary border-solid block h-[calc(100%-2px)] w-[calc(100%-2px)] absolute -left-[1px] -top-[1px] z-10 ",
  tableCellResizer:
    "EditorTheme__tableCellResizer absolute -right-1 h-full w-2 cursor-ew-resize z-10 top-0",
  tableCellSelected: "EditorTheme__tableCellSelected bg-muted",
  tableCellSortedIndicator:
    "EditorTheme__tableCellSortedIndicator block opacity-50 bsolute bottom-0 left-0 w-full h-1 bg-muted",
  tableResizeRuler:
    "EditorTheme__tableCellResizeRuler block absolute w-[1px] h-full bg-primary top-0",
  tableRowStriping:
    "EditorTheme__tableRowStriping m-0 border-t p-0 even:bg-muted",
  tableSelected: "EditorTheme__tableSelected ring-2 ring-primary ring-offset-2",
  tableSelection: "EditorTheme__tableSelection bg-transparent",
  layoutItem: "border border-dashed px-4 py-2",
  layoutContainer: "grid gap-2.5 my-2.5 mx-0",
  autocomplete: "text-muted-foreground",
  blockCursor: "",
  embedBlock: {
    base: "user-select-none",
    focus: "ring-2 ring-primary ring-offset-2",
  },
  hr: 'p-0.5 border-none my-1 mx-0 cursor-pointer after:content-[""] after:block after:h-0.5 after:bg-muted selected:ring-2 selected:ring-primary selected:ring-offset-2 selected:user-select-none',
  indent: "[--lexical-indent-base-value:40px]",
  mark: "",
  markOverlap: "",
}
