import { NextRequest, NextResponse } from "next/server";
import { notifyEmailIdsReady } from "../email-status/route";
import crypto from "crypto";

// Configurações centralizadas do produto
const PRODUCT_CONFIG = {
  NAME: "Assinatura Numbly Club",
  SKU: "NUMEROLOGICA-CLUB-001", 
  PRICE: 27.00,
  CURRENCY: "BRL"
};

// Interfaces TypeScript
interface CreditCardData {
  number: string;
  cvv: string;
  month: string;
  year: string;
  document_number: string;
  name: string;
  installments?: number;
  soft_descriptor?: string;
}

interface SanitizedData {
  email: string;
  name: string;
  phone: string;
  document: string;
  paymentMethod: string;
  skipPixelsAndEmails: boolean;
}

interface CustomerPayload {
  "access-token": string;
  firstname: string;
  lastname: string;
  email: string;
  telephone: string;
  digital_product: number;
  document?: string;
}

interface OrderPayload {
  "access-token": string;
  total: number;
  products: Array<{
    sku: string;
    name: string;
    qty: number;
  }>;
  customer_id: string;
}

// Função para fazer hash SHA-256 do email
function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
}

// Função para enviar evento InitiateCheckout para o TikTok Pixel
async function sendTikTokInitiateCheckoutEvent(email: string): Promise<void> {
  try {
    // Verificar se as credenciais do TikTok estão configuradas
    if (!process.env.TT_PIXEL_ID || !process.env.TT_ACCESS_TOKEN) {
      console.log('[TikTok Pixel] Credenciais não configuradas, pulando tracking');
      return;
    }

    const hashedEmail = hashEmail(email);
    const eventTime = Math.floor(Date.now() / 1000);

    const payload = {
      "event_source": "web",
      "event_source_id": process.env.TT_PIXEL_ID,
      "data": [
        {
          "event": "InitiateCheckout",
          "event_time": eventTime,
          "user": {
            "email": hashedEmail
            // Removendo phone e external_id pois TikTok não aceita valores null
          },
          "properties": {
            "currency": PRODUCT_CONFIG.CURRENCY,
            "value": PRODUCT_CONFIG.PRICE,
            "content_type": "product"
          },
          "page": {
            "url": "https://numbly.life"
            // Removendo referrer pois TikTok não aceita null
          }
        }
      ]
    };

    console.log(`[TikTok Pixel] Enviando evento InitiateCheckout para ${email} (hash: ${hashedEmail.substring(0, 8)}...)`);

    const response = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
      method: 'POST',
      headers: {
        'Access-Token': process.env.TT_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[TikTok Pixel] ✅ Evento InitiateCheckout enviado com sucesso:`, result);
    } else {
      const errorText = await response.text();
      console.error(`[TikTok Pixel] ❌ Erro ao enviar evento:`, response.status, errorText);
    }

  } catch (error) {
    console.error('[TikTok Pixel] Erro ao enviar evento InitiateCheckout:', error);
  }
}

// Função para enviar evento InitiateCheckout para o Meta Pixel (Facebook)
async function sendMetaInitiateCheckoutEvent(email: string): Promise<void> {
  try {
    if (!process.env.META_PIXEL_ID || !process.env.META_CAPI_TOKEN) {
      console.log('[Meta Pixel] Credenciais não configuradas, pulando tracking');
      return;
    }

    // Hash do email para privacidade (Meta exige SHA-256)
    const hashedEmail = hashEmail(email);
    const eventTime = Math.floor(Date.now() / 1000);

    const payload = {
      data: [
        {
          event_name: 'InitiateCheckout',
          event_time: eventTime,
          user_data: {
            em: [hashedEmail]
          },
          custom_data: {
            currency: PRODUCT_CONFIG.CURRENCY,
            value: PRODUCT_CONFIG.PRICE,
            content_type: 'product'
          },
          action_source: 'website',
          event_source_url: 'https://numbly.life'
        }
      ],
      access_token: process.env.META_CAPI_TOKEN
    };

    console.log(`[Meta Pixel] Enviando evento InitiateCheckout para ${email} (hash: ${hashedEmail.substring(0, 8)}...)`);

    const url = `https://graph.facebook.com/v18.0/${process.env.META_PIXEL_ID}/events`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      console.log(`[Meta Pixel] ✅ Evento InitiateCheckout enviado com sucesso:`, result);
    } else {
      const errorText = await response.text();
      console.error(`[Meta Pixel] ❌ Erro ao enviar evento:`, response.status, errorText);
    }
  } catch (error) {
    console.error('[Meta Pixel] Erro ao enviar evento InitiateCheckout:', error);
  }
}

// =================== POST ====================
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // REMOVIDO: Rate limiting
    // const rateLimitChecker = paymentRateLimiter;
    // const rateLimitResult: RateLimitResult = rateLimitChecker(request);
    // if (rateLimitResult && rateLimitResult.status) {
    //   return NextResponse.json({ error: "Rate limit exceeded" }, { status: rateLimitResult.status });
    // }

    const body = await request.json();
    
    // Validações de segurança
    if (!body.email || !body.name) {
      return NextResponse.json({ 
        error: "Email e nome são obrigatórios" 
      }, { status: 400 });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json({ 
        error: "Formato de email inválido" 
      }, { status: 400 });
    }

    // Sanitizar dados de entrada
    const sanitizedData: SanitizedData = {
      email: body.email.trim().toLowerCase(),
      name: body.name.trim(),
      phone: body.telephone || body.phone || "(11) 99999-9999", // Sempre usar telefone padrão
      document: body.document?.trim() || "",
      paymentMethod: body.paymentMethod || 'pix',
      skipPixelsAndEmails: body.skipPixelsAndEmails || false // Flag para pular pixels/emails
    };

    // Log para debug (remover em produção)
    if (process.env.NODE_ENV === 'development') {
      console.log("[APPMAX] Dados sanitizados:", {
        email: sanitizedData.email,
        name: sanitizedData.name,
        phone: sanitizedData.phone,
        document: sanitizedData.document ? sanitizedData.document.substring(0, 3) + '...' : 'vazio',
        paymentMethod: sanitizedData.paymentMethod,
        skipPixelsAndEmails: sanitizedData.skipPixelsAndEmails
      });
    }

    const accessToken = process.env.APPMAX_API_KEY;
    if (!accessToken) {
      throw new Error("Chave da Appmax não configurada.");
    }

    // Criar cliente
    const customerPayload: CustomerPayload = {
      "access-token": accessToken,
      firstname: sanitizedData.name.split(" ")[0] || "Nome",
      lastname: sanitizedData.name.split(" ").slice(1).join(" ") || "Sobrenome",
      email: sanitizedData.email,
      telephone: sanitizedData.phone,
      digital_product: 1
    };

    // Adicionar CPF se fornecido (obrigatório para cartão)
    if (sanitizedData.document && sanitizedData.document.length >= 11) {
      // Manter formato com pontos e hífen: 191.000.000-00
      const cleanDocument = sanitizedData.document.replace(/\D/g, "");
      customerPayload.document = cleanDocument.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }

    // Log para debug (remover em produção)
    if (process.env.NODE_ENV === 'development') {
      console.log("[APPMAX] Customer payload:", {
        ...customerPayload,
        document: customerPayload.document ? customerPayload.document.substring(0, 3) + '...' : 'não fornecido'
      });
    }

    const customerRes = await fetch("https://admin.appmax.com.br/api/v3/customer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerPayload)
    });

    if (!customerRes.ok) {
      console.error("[APPMAX] ❌ Erro ao criar cliente:", customerRes.status, customerRes.statusText);
      return NextResponse.json({ 
        success: false,
        error: "Erro ao criar cliente",
        message: `Erro do servidor: ${customerRes.status}`
      }, { status: 500 });
    }

    const customerData = await customerRes.json();
    
    // Verificar se a resposta tem a estrutura esperada
    if (!customerData || (typeof customerData !== 'object')) {
      console.error("[APPMAX] ❌ Resposta inválida ao criar cliente:", customerData);
      return NextResponse.json({ 
        success: false,
        error: "Resposta inválida do servidor",
        message: "Servidor retornou dados inválidos"
      }, { status: 500 });
    }

    const customerId = customerData.data?.id || customerData.id;

    if (!customerId) {
      console.error("[APPMAX] ❌ ID do cliente não encontrado na resposta:", customerData);
      return NextResponse.json({ 
        success: false,
        error: "Erro ao obter ID do cliente", 
        message: "Servidor não retornou ID do cliente",
        debug: process.env.NODE_ENV === 'development' ? customerData : undefined 
      }, { status: 500 });
    }

    // Criar pedido
    const orderPayload: OrderPayload = {
      "access-token": accessToken,
      total: PRODUCT_CONFIG.PRICE,
      products: [
        {
          sku: PRODUCT_CONFIG.SKU,
          name: PRODUCT_CONFIG.NAME,
          qty: 1
        }
      ],
      customer_id: customerId
    };

    const orderRes = await fetch("https://admin.appmax.com.br/api/v3/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload)
    });

    if (!orderRes.ok) {
      console.error("[APPMAX] ❌ Erro ao criar pedido:", orderRes.status, orderRes.statusText);
      return NextResponse.json({ 
        success: false,
        error: "Erro ao criar pedido",
        message: `Erro do servidor: ${orderRes.status}`
      }, { status: 500 });
    }

    const orderData = await orderRes.json();
    
    // Verificar se a resposta tem a estrutura esperada
    if (!orderData || (typeof orderData !== 'object')) {
      console.error("[APPMAX] ❌ Resposta inválida ao criar pedido:", orderData);
      return NextResponse.json({ 
        success: false,
        error: "Resposta inválida do servidor",
        message: "Servidor retornou dados inválidos"
      }, { status: 500 });
    }

    let orderId = orderData.data?.id;
    if (!orderId) {
      console.error("[APPMAX] ❌ ID do pedido não encontrado na resposta:", orderData);
      return NextResponse.json({ 
        success: false,
        error: "Erro ao criar pedido", 
        message: "Servidor não retornou ID do pedido",
        debug: process.env.NODE_ENV === 'development' ? orderData : undefined 
      }, { status: 500 });
    }

    if (!sanitizedData.document) {
      return NextResponse.json({ error: "Documento obrigatório" }, { status: 400 });
    }

    const paymentMethod = sanitizedData.paymentMethod;

    if (paymentMethod === 'credit-card') {
      const cc: CreditCardData = body.creditCard;
      
      if (!cc || !cc.number || !cc.cvv || !cc.month || !cc.year || !cc.document_number || !cc.name) {
        return NextResponse.json({ 
          success: false,
          error: "Dados do cartão incompletos",
          message: "Todos os campos do cartão são obrigatórios"
        }, { status: 400 });
      }

      // Validações específicas dos dados do cartão
      const cardNumber = cc.number.replace(/\s/g, '');
      if (cardNumber.length < 13 || cardNumber.length > 19) {
        return NextResponse.json({ 
          success: false,
          error: "Número do cartão inválido",
          message: "Número do cartão deve ter entre 13 e 19 dígitos"
        }, { status: 400 });
      }

      if (cc.cvv.length < 3 || cc.cvv.length > 4) {
        return NextResponse.json({ 
          success: false,
          error: "CVV inválido",
          message: "CVV deve ter 3 ou 4 dígitos"
        }, { status: 400 });
      }

      // Validar mês e ano
      const month = parseInt(cc.month);
      const year = parseInt(cc.year);
      const currentYear = new Date().getFullYear() % 100; // Últimos 2 dígitos
      
      if (month < 1 || month > 12) {
        return NextResponse.json({ 
          success: false,
          error: "Mês inválido",
          message: "Mês deve estar entre 01 e 12"
        }, { status: 400 });
      }

      if (year < currentYear || year > (currentYear + 20)) {
        return NextResponse.json({ 
          success: false,
          error: "Ano inválido",
          message: "Ano de validade inválido"
        }, { status: 400 });
      }

      // Validação adicional de segurança
      if (!sanitizedData.document || sanitizedData.document.length < 11) {
        return NextResponse.json({ 
          success: false,
          error: "CPF obrigatório para pagamentos com cartão",
          message: "CPF é obrigatório para pagamentos com cartão"
        }, { status: 400 });
      }

      // Verificar se CPF é válido (básico)
      if (sanitizedData.document.replace(/\D/g, '') === '00000000000') {
        return NextResponse.json({ 
          success: false,
          error: "CPF inválido",
          message: "CPF fornecido não é válido"
        }, { status: 400 });
      }

      const creditCardPayload = {
        "access-token": accessToken,
        cart: { order_id: orderId },
        customer: { customer_id: customerId },
        payment: {
          CreditCard: {
            number: cc.number,
            cvv: cc.cvv,
            month: cc.month,
            year: cc.year,
            document_number: cc.document_number,
            name: cc.name,
            installments: cc.installments || 1,
            soft_descriptor: cc.soft_descriptor || "NUMEROLOGICA"
          }
        }
      };

      console.log("[APPMAX] Enviando dados do cartão para processamento...");
      console.log("[APPMAX] Payload do cartão:", {
        hasNumber: !!creditCardPayload.payment.CreditCard.number,
        numberLength: creditCardPayload.payment.CreditCard.number?.length,
        hasName: !!creditCardPayload.payment.CreditCard.name,
        hasMonth: !!creditCardPayload.payment.CreditCard.month,
        hasYear: !!creditCardPayload.payment.CreditCard.year,
        hasCvv: !!creditCardPayload.payment.CreditCard.cvv,
        hasDocument: !!creditCardPayload.payment.CreditCard.document_number,
        orderId: creditCardPayload.cart.order_id,
        customerId: creditCardPayload.customer.customer_id
      });
      
      // Sistema de retry para erros temporários
      let ccRes: Response;
      let ccData: Record<string, unknown>;
      let attempts = 0;
      const maxAttempts = 1;
      
      do {
        attempts++;
        console.log(`[APPMAX] Tentativa ${attempts}/${maxAttempts}`);
        
        ccRes = await fetch("https://admin.appmax.com.br/api/v3/payment/credit-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creditCardPayload)
        });

        ccData = await ccRes.json();
        
        console.log("[APPMAX] Resposta do pagamento:", { 
          attempt: attempts,
          status: ccRes.status, 
          ok: ccRes.ok, 
          hasData: !!ccData.data,
          error: ccData.error || ccData.message || ccData.text,
          fullResponse: ccData
        });

        // Se foi sucesso ou erro não recuperável, sair do loop
        if (ccRes.ok) {
          break;
        }
        
        // Se o pedido foi cancelado, tentar recriar (apenas uma vez)
        if (typeof ccData.text === 'string' && ccData.text.includes('Order is Cancelled') && attempts === 1) {
          console.log("[APPMAX] Pedido cancelado, tentando recriar...");
          
          // Recriar o pedido
          const newOrderRes = await fetch("https://admin.appmax.com.br/api/v3/order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderPayload)
          });
          
          const newOrderData = await newOrderRes.json();
          const newOrderId = newOrderData.data?.id;
          
          if (newOrderId) {
            console.log(`[APPMAX] Novo pedido criado: ${newOrderId}`);
            // Atualizar o payload com o novo order_id
            creditCardPayload.cart.order_id = newOrderId;
            orderId = newOrderId;
          }
        } else if (ccRes.status !== 500 && ccRes.status !== 502 && ccRes.status !== 503) {
          // Outros erros não recuperáveis
          break;
        }
        
        // Aguardar antes da próxima tentativa
        if (attempts < maxAttempts) {
          console.log("[APPMAX] Aguardando 1s antes da próxima tentativa...");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } while (attempts < maxAttempts);

      if (!ccRes.ok) {
        let errorMessage =
          ccData.text ||
          ccData.error ||
          ccData.message ||
          (ccData.data && typeof ccData.data === 'object' && 'message' in ccData.data ? (ccData.data as { message?: string }).message : undefined) ||
          (ccData.errors && Array.isArray(ccData.errors) ? ccData.errors.join(', ') : undefined) ||
          `Erro no pagamento (${ccRes.status})`;

        // Se ccData for objeto com chave 0, use o valor dela como mensagem
        if (ccData && typeof ccData === 'object' && ccData[0]) {
          errorMessage = ccData[0];
        }

        // Se for Order is Cancelled, mostrar mensagem amigável
        let userMessage = errorMessage;
        if (typeof errorMessage === 'string' && errorMessage.trim() === 'Order is Cancelled') {
          userMessage = 'Houve um problema com o pedido, tente novamente.';
        }
        
        console.error("[APPMAX] ❌ Erro no pagamento:", errorMessage);
        console.error("[APPMAX] ❌ Dados completos do erro:", ccData);
        return NextResponse.json({ 
          success: false,
          error: userMessage,
          message: userMessage,
          debug: process.env.NODE_ENV === 'development' ? ccData : undefined 
        }, { status: 400 });
      }

      if (!ccData.data) {
        console.error("[APPMAX] ❌ Resposta sem dados:", ccData);
        return NextResponse.json({ 
          success: false,
          error: "Falha no processamento do pagamento",
          message: "Gateway não retornou dados do pagamento"
        }, { status: 500 });
      }

      const response = NextResponse.json({
        success: true,
        message: "Pagamento com cartão realizado com sucesso",
        customer_id: customerId,
        order_id: orderId,
        credit_card: ccData.data,
      }, { status: 200 });

      return response;

    } else {
      // PIX padrão
      const expiration = new Date(Date.now() + 60 * 60 * 1000).toISOString().replace("T", " ").substring(0, 19);
      const pixPayload = {
        "access-token": accessToken,
        cart: { order_id: orderId },
        customer: { customer_id: customerId },
        payment: {
          pix: {
            document_number: sanitizedData.document,
            expiration_date: expiration
          }
        }
      };

      const pixRes = await fetch("https://admin.appmax.com.br/api/v3/payment/pix", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(pixPayload)
      });

      if (!pixRes.ok) {
        console.error("[APPMAX] ❌ Erro ao gerar PIX:", pixRes.status, pixRes.statusText);
        
        let errorMessage = "Erro ao gerar PIX";
        
        try {
          const pixErrorData = await pixRes.json();
          if (pixErrorData.error) {
            errorMessage = pixErrorData.error;
          } else if (pixErrorData.message) {
            errorMessage = pixErrorData.message;
          }
        } catch (e) {
          console.error("[APPMAX] ❌ Erro ao parsear resposta PIX:", e);
          errorMessage = `Erro do servidor: ${pixRes.status}`;
        }
        
        return NextResponse.json({ 
          success: false,
          error: errorMessage,
          message: errorMessage,
          debug: process.env.NODE_ENV === 'development' ? { status: pixRes.status, statusText: pixRes.statusText } : undefined 
        }, { status: 400 });
      }

      const pixData = await pixRes.json();
      
      // Verificar se a resposta tem a estrutura esperada
      if (!pixData || (typeof pixData !== 'object')) {
        console.error("[APPMAX] ❌ Resposta PIX inválida:", pixData);
        return NextResponse.json({ 
          success: false,
          error: "Resposta inválida do servidor",
          message: "Servidor retornou dados PIX inválidos"
        }, { status: 500 });
      }

      // Verificar se temos dados essenciais do PIX
      if (!pixData.data) {
        console.error("[APPMAX] ❌ PIX sem dados:", pixData);
        return NextResponse.json({ 
          success: false,
          error: "PIX não foi gerado corretamente",
          message: "Servidor não retornou dados do PIX"
        }, { status: 500 });
      }

      const qrCodeBase64 = pixData.data?.pix_qrcode;
      const qrCodeImage = qrCodeBase64 ? `data:image/png;base64,${qrCodeBase64}` : null;
      const pixEmv = pixData.data?.pix_emv || null;

      // Enviar evento InitiateCheckout para TikTok Pixel (apenas para PIX e se não pular pixels)
      if (!sanitizedData.skipPixelsAndEmails) {
        try {
          await sendTikTokInitiateCheckoutEvent(sanitizedData.email);
        } catch (error) {
          console.warn('[TikTok Pixel] Erro ao enviar InitiateCheckout (PIX - continuando):', error);
        }
        // Enviar evento InitiateCheckout para Meta Pixel (apenas para PIX)
        try {
          await sendMetaInitiateCheckoutEvent(sanitizedData.email);
        } catch (error) {
          console.warn('[Meta Pixel] Erro ao enviar InitiateCheckout (PIX - continuando):', error);
        }
      } else {
        console.log('[PIXELS] ⏭️ Pulando envio de pixels PIX (skipPixelsAndEmails=true)');
      }

      // Agendar emails em background (apenas se não pular emails)
      if (!sanitizedData.skipPixelsAndEmails) {
        Promise.resolve().then(async () => {
          try {
            const baseUrl = process.env.NODE_ENV === 'development'
              ? 'http://localhost:3000'
              : (process.env.NEXT_PUBLIC_BASE_URL || 'https://numbly.life');

            const emailForScheduling = sanitizedData.email === 'felipedutra@outlook.com'
              ? 'delivered@resend.dev'
              : sanitizedData.email;

            const resendRes = await fetch(`${baseUrl}/api/resend`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "add",
                userEmail: emailForScheduling,
                userName: sanitizedData.name
              })
            });

            if (resendRes.ok) {
              const resendData = await resendRes.json();

              if (resendData.scheduledEmailIds && Array.isArray(resendData.scheduledEmailIds)) {
                const notified = notifyEmailIdsReady(orderId, resendData.scheduledEmailIds);

                if (!notified) {
                  const globalCache = global as { emailIdsCache?: Map<string, unknown> };
                  if (!globalCache.emailIdsCache) globalCache.emailIdsCache = new Map();
                  globalCache.emailIdsCache.set(orderId, {
                    scheduledEmailIds: resendData.scheduledEmailIds,
                    timestamp: Date.now(),
                    email: sanitizedData.email
                  });
                }
              }
            }
          } catch (error) {
            const errMsg = error instanceof Error ? error.message : String(error);
            console.warn("Erro no agendamento de emails:", errMsg);
          }
        });
      } else {
        console.log('[EMAILS] ⏭️ Pulando agendamento de emails (skipPixelsAndEmails=true)');
      }

      console.log(`[APPMAX] ✅ PIX gerado com sucesso - OrderID: ${orderId}`);

      const response = NextResponse.json({
        success: true,
        message: "Checkout gerado com sucesso",
        customer_id: customerId,
        order_id: orderId,
        qr_code_base64: qrCodeBase64,
        qr_code_img: qrCodeImage,
        pix_emv: pixEmv,
        checkout_url: pixData.data?.pix_payment_link || null,
        expiration: pixData.data?.pix_expiration_date || null
      }, { status: 200 });

      return response;
    }
  } catch (error: unknown) {
    console.error("[APPMAX] ❌ Erro não capturado:", error);
    // Garantir que sempre retornamos uma estrutura válida
    const errorMessage = error instanceof Error ? error.message : "Erro interno do servidor";
    return NextResponse.json({
      success: false,
      error: errorMessage,
      message: errorMessage,
      debug: process.env.NODE_ENV === 'development' ? error : undefined
    }, { status: 500 });
  }
}

// =================== GET ====================
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');

  if (!orderId) {
    return NextResponse.json({ error: "orderId é obrigatório" }, { status: 400 });
  }

  try {
    // Verificar se há dados de email em cache para este orderId
    const globalCache = global as { emailIdsCache?: Map<string, unknown> };
    if (globalCache.emailIdsCache && globalCache.emailIdsCache.has(orderId)) {
      const cachedData = globalCache.emailIdsCache.get(orderId) as {
        scheduledEmailIds: string[];
        timestamp: number;
        email: string;
      };
      globalCache.emailIdsCache.delete(orderId);

      return NextResponse.json({
        success: true,
        scheduledEmailIds: cachedData.scheduledEmailIds,
        timestamp: cachedData.timestamp,
        email: cachedData.email
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "IDs ainda não disponíveis",
        scheduledEmailIds: []
      });
    }
  } catch (error: unknown) {
    return NextResponse.json({
      error: error instanceof Error ? error.message : "Erro desconhecido",
      debug: error
    }, { status: 500 });
  }
}
