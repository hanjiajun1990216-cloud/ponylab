"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Table,
  TableRow,
  TableCell,
  TableHeader,
} from "@tiptap/extension-table";
import Image from "@tiptap/extension-image";
import Mention from "@tiptap/extension-mention";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useEffect, useRef, useCallback } from "react";
import {
  Bold,
  Italic,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Table as TableIcon,
  Image as ImageIcon,
  CheckSquare,
  Code2,
  Undo,
  Redo,
  Minus,
} from "lucide-react";

// 初始化 lowlight 语言高亮
const lowlight = createLowlight(common);

interface ELNEditorProps {
  content: string;
  onChange: (content: string) => void;
  saveStatus?: "saved" | "saving" | "unsaved";
  readOnly?: boolean;
}

// Mention suggestion 占位配置
const mentionSuggestion = {
  items: ({ query }: { query: string }) => {
    // Sprint 2 中由 Agent B 补充真实团队成员数据
    const mockMembers = [
      { id: "1", label: "张研究员" },
      { id: "2", label: "李博士" },
      { id: "3", label: "王工程师" },
    ];
    return mockMembers
      .filter((m) => m.label.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5);
  },
  render: () => {
    // 简单的 suggestion 渲染占位，完整 UI 由 Agent B 在后续 Sprint 完善
    let element: HTMLElement | null = null;
    return {
      onStart: () => {
        element = document.createElement("div");
        element.className =
          "fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-1 min-w-[160px]";
        document.body.appendChild(element);
      },
      onUpdate: (props: any) => {
        if (!element) return;
        const { clientRect, items, command } = props;
        const rect = clientRect?.();
        if (rect) {
          element.style.top = `${rect.bottom + 4}px`;
          element.style.left = `${rect.left}px`;
        }
        element.innerHTML = "";
        if (items.length === 0) {
          element.style.display = "none";
          return;
        }
        element.style.display = "block";
        items.forEach((item: any) => {
          const btn = document.createElement("button");
          btn.className =
            "flex w-full items-center gap-2 rounded px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100";
          btn.textContent = item.label;
          btn.addEventListener("click", () =>
            command({ id: item.id, label: item.label }),
          );
          element!.appendChild(btn);
        });
      },
      onKeyDown: () => false,
      onExit: () => {
        element?.remove();
        element = null;
      },
    };
  },
};

// 化学结构编辑器 NodeView 占位（ketcher-react 因包体积过大暂不集成）
// 预留接口：后续通过 createNodeFromContent + NodeViewWrapper 接入
// const ChemStructNodeView = ...

export default function ELNEditor({
  content,
  onChange,
  saveStatus = "saved",
  readOnly = false,
}: ELNEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // CodeBlock 由 CodeBlockLowlight 替代
        codeBlock: false,
      }),
      Table.configure({ resizable: true }),
      TableRow,
      TableCell,
      TableHeader,
      Image.configure({ inline: false, allowBase64: true }),
      Mention.configure({
        HTMLAttributes: { class: "mention" },
        suggestion: mentionSuggestion,
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder: "开始记录实验内容……" }),
      CharacterCount,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: content || "",
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onChange(html);
      }, 500);
    },
  });

  // 当外部 content 变化时同步（仅在编辑器内容与新值不同时更新，避免光标跳动）
  useEffect(() => {
    if (!editor) return;
    const currentHTML = editor.getHTML();
    if (content && content !== currentHTML) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  // 销毁时清理 debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const insertTable = useCallback(() => {
    editor
      ?.chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  const insertImage = useCallback(() => {
    const url = window.prompt("输入图片 URL：");
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  if (!editor) return null;

  const charCount = editor.storage.characterCount?.characters?.() ?? 0;

  const ToolbarButton = ({
    onClick,
    active,
    title,
    disabled,
    children,
  }: {
    onClick: () => void;
    active?: boolean;
    title: string;
    disabled?: boolean;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      disabled={disabled}
      className={`flex h-7 w-7 items-center justify-center rounded text-sm transition-colors
        ${active ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"}
        ${disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"}`}
    >
      {children}
    </button>
  );

  const Divider = () => <div className="mx-0.5 h-5 w-px bg-gray-200" />;

  return (
    <div className="flex flex-col rounded-lg border border-gray-200 bg-white overflow-hidden">
      {/* 工具栏 */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
          {/* 撤销/重做 */}
          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            title="撤销 (Ctrl+Z)"
          >
            <Undo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            title="重做 (Ctrl+Shift+Z)"
          >
            <Redo className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* 文字格式 */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="粗体 (Ctrl+B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="斜体 (Ctrl+I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* 标题 */}
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive("heading", { level: 2 })}
            title="标题 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor.isActive("heading", { level: 3 })}
            title="标题 3"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* 列表 */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="无序列表"
          >
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="有序列表"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            active={editor.isActive("taskList")}
            title="待办清单"
          >
            <CheckSquare className="h-3.5 w-3.5" />
          </ToolbarButton>

          <Divider />

          {/* 表格 */}
          <ToolbarButton onClick={insertTable} title="插入表格">
            <TableIcon className="h-3.5 w-3.5" />
          </ToolbarButton>

          {/* 图片 */}
          <ToolbarButton onClick={insertImage} title="插入图片">
            <ImageIcon className="h-3.5 w-3.5" />
          </ToolbarButton>

          {/* 代码块 */}
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="代码块"
          >
            <Code2 className="h-3.5 w-3.5" />
          </ToolbarButton>

          {/* 分割线 */}
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="插入分割线"
          >
            <Minus className="h-3.5 w-3.5" />
          </ToolbarButton>

          {/* 保存状态指示器（右侧） */}
          <div className="ml-auto flex items-center gap-1.5 pr-1 text-xs">
            {saveStatus === "saving" && (
              <>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-yellow-400" />
                <span className="text-yellow-600">保存中…</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                <span className="text-green-600">已保存</span>
              </>
            )}
            {saveStatus === "unsaved" && (
              <>
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                <span className="text-gray-500">未保存</span>
              </>
            )}
            <span className="ml-2 text-gray-400">{charCount} 字符</span>
          </div>
        </div>
      )}

      {/* 编辑器内容区 */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none min-h-[400px] px-6 py-4
          [&_.ProseMirror]:outline-none
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:text-gray-400
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left
          [&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none
          [&_.ProseMirror_table]:border-collapse
          [&_.ProseMirror_table_td]:border [&_.ProseMirror_table_td]:border-gray-300 [&_.ProseMirror_table_td]:p-2
          [&_.ProseMirror_table_th]:border [&_.ProseMirror_table_th]:border-gray-300 [&_.ProseMirror_table_th]:p-2 [&_.ProseMirror_table_th]:bg-gray-50 [&_.ProseMirror_table_th]:font-semibold
          [&_.mention]:text-blue-600 [&_.mention]:bg-blue-50 [&_.mention]:rounded [&_.mention]:px-1
          [&_ul[data-type=taskList]]:list-none [&_ul[data-type=taskList]]:pl-0
          [&_li[data-type=taskItem]]:flex [&_li[data-type=taskItem]]:items-start [&_li[data-type=taskItem]]:gap-2
          [&_li[data-type=taskItem]>label]:flex [&_li[data-type=taskItem]>label]:items-center"
      />
    </div>
  );
}
