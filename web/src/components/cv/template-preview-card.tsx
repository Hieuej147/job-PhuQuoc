"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, Edit, X } from "lucide-react";
import { SaveTemplateDialog } from "@/components/cv/save-template-dialog";

interface TemplateResult {
  name: string;
  description: string;
  html: string;
  css: string;
}

export function TemplatePreviewCard({
  result,
  onAdjust,
}: {
  result: TemplateResult;
  onAdjust?: () => void;
}) {
  const [showPreview, setShowPreview] = useState(false);

  // Create a simple preview by rendering a subset of the HTML
  const previewHtml = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>${result.css}</style>
</head>
<body>
  ${result.html.replace(/\{\{[^}]+\}\}/g, "…")}
</body>
</html>`;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-sm">{result.name}</CardTitle>
            <p className="text-xs text-gray-500 mt-1">{result.description}</p>
          </div>
          <Badge variant="secondary" className="text-xs">
            Template mới
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Preview thumbnail */}
        <div
          className="border rounded-lg overflow-hidden bg-white cursor-pointer hover:shadow-md transition-shadow"
          style={{ height: "200px" }}
          onClick={() => setShowPreview(true)}
        >
          <div
            className="w-full h-full overflow-hidden"
            style={{
              transform: "scale(0.25)",
              transformOrigin: "top left",
              width: "400%",
              height: "400%",
            }}
          >
            <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <SaveTemplateDialog
            html={result.html}
            css={result.css}
            name={result.name}
            description={result.description}
          />
          {onAdjust && (
            <Button variant="outline" size="sm" onClick={onAdjust}>
              <Edit className="size-3.5 mr-1" /> Điều chỉnh
            </Button>
          )}
        </div>
      </CardContent>

      {/* Full preview modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold">{result.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPreview(false)}
              >
                <X className="size-4" />
              </Button>
            </div>
            <div
              className="overflow-auto p-4"
              style={{ maxHeight: "calc(90vh - 80px)" }}
            >
              <div className="max-w-[210mm] mx-auto bg-white shadow-lg">
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
