'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect, useRef } from 'react';
import {
  Bold, Italic, UnderlineIcon, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link2, ImageIcon, Minus,
  Undo2, Redo2, Heading2, Heading3,
} from 'lucide-react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  onImageUpload?: (file: File) => Promise<string>;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, onImageUpload, placeholder }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ inline: false, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? '상품 상세 설명을 입력하세요.' }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[300px] px-4 py-3 focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value, false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  async function handleImageFile(file: File) {
    if (!editor) return;
    try {
      let url: string;
      if (onImageUpload) {
        url = await onImageUpload(file);
      } else {
        url = URL.createObjectURL(file);
      }
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      alert('이미지 업로드에 실패했습니다.');
    }
  }

  function setLink() {
    const url = prompt('링크 URL을 입력하세요:');
    if (!url) return;
    editor?.chain().focus().setLink({ href: url }).run();
  }

  if (!editor) return null;

  const btn = (active: boolean, onClick: () => void, children: React.ReactNode, title?: string) => (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      className={`rounded p-1.5 transition-colors ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}
    >
      {children}
    </button>
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-300 bg-white focus-within:ring-2 focus-within:ring-blue-500">
      {/* 툴바 */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-gray-200 bg-gray-50 px-2 py-1.5">
        {btn(editor.isActive('heading', { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), <Heading2 size={16} />, '제목2')}
        {btn(editor.isActive('heading', { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), <Heading3 size={16} />, '제목3')}

        <div className="mx-1 h-5 w-px bg-gray-300" />

        {btn(editor.isActive('bold'), () => editor.chain().focus().toggleBold().run(), <Bold size={15} />, '굵게')}
        {btn(editor.isActive('italic'), () => editor.chain().focus().toggleItalic().run(), <Italic size={15} />, '기울임')}
        {btn(editor.isActive('underline'), () => editor.chain().focus().toggleUnderline().run(), <UnderlineIcon size={15} />, '밑줄')}
        {btn(editor.isActive('strike'), () => editor.chain().focus().toggleStrike().run(), <Strikethrough size={15} />, '취소선')}

        <div className="mx-1 h-5 w-px bg-gray-300" />

        {btn(editor.isActive({ textAlign: 'left' }), () => editor.chain().focus().setTextAlign('left').run(), <AlignLeft size={15} />, '왼쪽 정렬')}
        {btn(editor.isActive({ textAlign: 'center' }), () => editor.chain().focus().setTextAlign('center').run(), <AlignCenter size={15} />, '가운데 정렬')}
        {btn(editor.isActive({ textAlign: 'right' }), () => editor.chain().focus().setTextAlign('right').run(), <AlignRight size={15} />, '오른쪽 정렬')}

        <div className="mx-1 h-5 w-px bg-gray-300" />

        {btn(editor.isActive('bulletList'), () => editor.chain().focus().toggleBulletList().run(), <List size={15} />, '글머리 기호')}
        {btn(editor.isActive('orderedList'), () => editor.chain().focus().toggleOrderedList().run(), <ListOrdered size={15} />, '번호 목록')}

        <div className="mx-1 h-5 w-px bg-gray-300" />

        {btn(editor.isActive('link'), setLink, <Link2 size={15} />, '링크')}
        {btn(false, () => fileInputRef.current?.click(), <ImageIcon size={15} />, '이미지 삽입')}
        {btn(false, () => editor.chain().focus().setHorizontalRule().run(), <Minus size={15} />, '구분선')}

        <div className="mx-1 h-5 w-px bg-gray-300" />

        {btn(false, () => editor.chain().focus().undo().run(), <Undo2 size={15} />, '실행 취소')}
        {btn(false, () => editor.chain().focus().redo().run(), <Redo2 size={15} />, '다시 실행')}
      </div>

      {/* 에디터 본문 */}
      <EditorContent editor={editor} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleImageFile(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}
