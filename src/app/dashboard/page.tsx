'use client';

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { supa } from "@/sync/supabase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";

interface Document {
  id: string;
  title: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user }, error: userError } = await supa.auth.getUser();
      
      if (userError || !user) {
        router.push("/login");
        return;
      }
      
      setUser(user);

      const { data: docs, error: docsError } = await supa
        .from("documents")
        .select("id, title")
        .eq("user_id", user.id);

      if (docsError) {
        console.error("Erro ao buscar documentos:", docsError);
      } else {
        setDocuments(docs);
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  const handleNewDocument = async () => {
    if (!user) return;

    const { data, error } = await supa
      .from("documents")
      .insert({ 
        user_id: user.id, 
        title: "Documento sem título",
        status: 'draft',
        content: {}
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao criar documento:", error);
    } else if (data) {
      router.push(`/editor-x/${data.id}`);
    }
  };

  const handleLogout = async () => {
    await supa.auth.signOut();
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Meus Documentos</h1>
          <Button onClick={handleNewDocument}>Novo Documento</Button>
        </div>
        <div className="flex items-center gap-4">
          {user && <p className="text-muted-foreground text-sm hidden md:block">{user.email}</p>}
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </header>

      <main>
        {documents.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <Link href={`/editor-x/${doc.id}`} key={doc.id}>
                <Card className="hover:bg-muted/50 transition-colors">
                  <CardHeader>
                    <CardTitle>{doc.title}</CardTitle>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed rounded-lg">
            <h2 className="text-xl font-medium text-muted-foreground">
              Você ainda não tem nenhum documento.
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Clique em "Novo Documento" para começar a escrever.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}