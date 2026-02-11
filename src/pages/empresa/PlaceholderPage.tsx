import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function PlaceholderPage() {
  const { pathname } = useLocation();
  const name = pathname.split("/").filter(Boolean).pop() || "Página";
  const title = name.charAt(0).toUpperCase() + name.slice(1);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-foreground">{title}</h1>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Construction className="h-5 w-5" /> Em construção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Esta página será implementada na próxima fase.</p>
        </CardContent>
      </Card>
    </div>
  );
}
