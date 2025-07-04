import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "numbly-secret-key-2025",
);

// Rotas que não precisam de autenticação
const publicRoutes = [
  "/",
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/magic",
  "/api/auth/verify",
  "/api/auth/check-user",
  "/api/auth/check-device-push",
  "/api/push/subscribe",
  "/api/health",
  "/api/get-ip",
  "/about",
];

// Rotas que redirecionam usuários autenticados
const authRoutes = ["/api/auth/register", "/api/auth/login"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Para desenvolvimento, só desabilitar se explicitamente configurado
  if (process.env.DISABLE_AUTH_MIDDLEWARE === "true") {
    return NextResponse.next();
  }

  // Permitir arquivos estáticos e página inicial
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname.includes(".") ||
    pathname === "/about" ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("auth-token")?.value;

  // Verificar se é uma rota pública
  if (publicRoutes.includes(pathname)) {
    // Se usuário está logado e tenta acessar tela de login/registro, redireciona para dashboard
    if (token && authRoutes.includes(pathname)) {
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL("/dashboard", request.url));
      } catch {
        // Token inválido, permite acesso à rota
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // Para rotas protegidas, verificar token
  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }
    // Redirecionar para página inicial onde usuário pode escolher login/registro
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);

    if (!payload.userId) {
      throw new Error("Token sem userId");
    }

    // Adicionar dados do usuário ao header da requisição
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-user-id", payload.userId as string);
    if (payload.deviceId) {
      requestHeaders.set("x-device-id", payload.deviceId as string);
    }
    if (payload.nome) {
      requestHeaders.set("x-user-name", payload.nome as string);
    }

    // Adicionar dados ao request para APIs
    const enhancedRequest = {
      ...request,
      headers: requestHeaders,
    };

    return NextResponse.next({
      request: enhancedRequest,
    });
  } catch (error) {
    console.error("Token inválido:", error);

    // Remover cookie inválido
    const response = pathname.startsWith("/api/")
      ? NextResponse.json({ error: "Token inválido" }, { status: 401 })
      : NextResponse.redirect(new URL("/", request.url));

    response.cookies.delete("auth-token");
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|.*\\.png$|.*\\.svg$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.ico$).*)",
  ],
};
