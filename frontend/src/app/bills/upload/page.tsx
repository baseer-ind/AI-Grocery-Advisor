"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { UploadCloud, FileImage, FileText, ImageIcon, CheckCircle2, ArrowRight } from "lucide-react";
import { billUploadResult } from "@/lib/mock-data";
import { formatINR, cn } from "@/lib/utils";

export default function BillUpload() {
  const router = useRouter();
  const [uploaded, setUploaded] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  return (
    <AppShell>
      <div className="mb-6">
        <h2 className="text-2xl font-semibold tracking-tight">Upload a Bill</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Upload a bill, receipt, or screenshot — we&apos;ll extract every product automatically.
        </p>
      </div>

      {!uploaded ? (
        <Card>
          <CardContent className="pt-6">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                setUploaded(true);
              }}
              className={cn(
                "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors",
                dragActive ? "border-primary bg-primary/5" : "border-border bg-muted/30"
              )}
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                <UploadCloud className="h-6 w-6" />
              </div>
              <h3 className="text-base font-medium">Drag and drop your bill here</h3>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Supports images, PDFs, and screenshots from any grocery app or store receipt.
              </p>
              <Button className="mt-5" onClick={() => setUploaded(true)}>
                Browse Files
              </Button>
              <div className="mt-6 flex items-center gap-6 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <FileImage className="h-3.5 w-3.5" /> Image
                </span>
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" /> PDF
                </span>
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="h-3.5 w-3.5" /> Screenshot
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <CheckCircle2 className="h-4 w-4 text-success" /> {billUploadResult.fileName}
            </CardTitle>
            <CardDescription>Extracted successfully — review the items below.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 rounded-xl bg-muted p-4 text-center">
              <div>
                <div className="text-lg font-semibold">{billUploadResult.productsFound}</div>
                <div className="text-xs text-muted-foreground">Products Found</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{billUploadResult.categories}</div>
                <div className="text-xs text-muted-foreground">Categories</div>
              </div>
              <div>
                <div className="text-lg font-semibold">{formatINR(billUploadResult.totalSpend)}</div>
                <div className="text-xs text-muted-foreground">Total Spend</div>
              </div>
            </div>

            <Separator className="my-5" />

            <div className="space-y-2">
              {billUploadResult.items.map((item) => (
                <div key={item.name} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                  <div>
                    <div className="text-sm font-medium">{item.name}</div>
                    <Badge variant="muted" className="mt-1">
                      {item.category}
                    </Badge>
                  </div>
                  <div className="text-sm font-semibold">{formatINR(item.price)}</div>
                </div>
              ))}
            </div>

            <Button className="mt-6 w-full gap-2" size="lg" onClick={() => router.push("/bills/analysis")}>
              Analyze My Spending <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
