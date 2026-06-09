"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2 } from "lucide-react";

interface Field {
  name: string;
  label: string;
  type?: "input" | "textarea";
  placeholder?: string;
  colSpan?: number;
}

interface ResumeSectionEditorProps {
  title: string;
  items: Record<string, string>[];
  fields: Field[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: string) => void;
  itemLabel?: string;
}

export function ResumeSectionEditor({
  title,
  items,
  fields,
  onAdd,
  onRemove,
  onUpdate,
  itemLabel = "item",
}: ResumeSectionEditorProps) {
  return (
    <div className="bg-white border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">{title}</h2>
        <Button variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-4 mr-1" /> Thêm
        </Button>
      </div>
      {items.map((item, i) => (
        <div key={i} className="border rounded-lg p-4 space-y-3">
          <div className="flex justify-between items-start">
            <h3 className="font-medium">{itemLabel} #{i + 1}</h3>
            <Button variant="ghost" size="sm" onClick={() => onRemove(i)}>
              <Trash2 className="size-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fields.map((field) => (
              <div key={field.name} className={field.colSpan === 2 ? "md:col-span-2" : ""}>
                {field.type === "textarea" ? (
                  <Textarea
                    value={item[field.name] || ""}
                    onChange={(e) => onUpdate(i, field.name, e.target.value)}
                    placeholder={field.placeholder || field.label}
                    rows={2}
                  />
                ) : (
                  <Input
                    value={item[field.name] || ""}
                    onChange={(e) => onUpdate(i, field.name, e.target.value)}
                    placeholder={field.placeholder || field.label}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
