import { AppLayout } from "@/components/ui/app-layout";
import { AppBar } from "@/components/ui/appbar";

export default function NotFound() {
  return (
    <AppLayout title="Página Não Encontrada">
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="text-lg text-gray-700 mt-4">
          A página que você está procurando não existe.
        </p>
      </div>
    </AppLayout>
  );
}
