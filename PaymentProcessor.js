const fs = require('fs');
const path = require('path');

// Simulação de Logger Seguro (Nunca logar dados sensíveis em produção)
const logger = {
    info: (msg, meta) => console.log(`[INFO] ${msg}`, meta ? JSON.stringify(meta) : ''),
    error: (msg, err) => console.error(`[ERROR] ${msg}`, err.message),
    // Função para mascarar dados sensíveis (PCI-DSS)
    mask: (data) => data.replace(/\d{12}/g, '************') 
};

class PaymentProcessor {
    constructor() {
        this.configPath = path.join(__dirname, 'payment-rules.json');
        this.dbPath = path.join(__dirname, 'transactions.json');
        this.rules = this.loadRules();
        this.processedTransactions = new Set(); // Simulação de banco de dados para Idempotência
        this.rateLimitStore = new Map(); // Armazenamento em memória para Rate Limit
    }

    loadRules() {
        try {
            const data = fs.readFileSync(this.configPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            logger.error("Falha ao carregar regras de pagamento. Usando defaults.", error);
            throw new Error("Configuração crítica ausente.");
        }
    }

    /**
     * Processa um pagamento de forma segura e dinâmica.
     * @param {Object} request - { userId, amount, currency, method, idempotencyKey, sensitiveData }
     */
    async process(request) {
        // HOT RELOAD: Recarrega regras a cada requisição para garantir que edições no JSON funcionem na hora
        this.rules = this.loadRules();

        try {
            // 0. Normalização de Dados (Adapter para Payload do Cliente)
            
            // Tenta extrair API Key de headers (caso venha de um request HTTP completo)
            let providedKey = request.apiKey;
            if (!providedKey && request.headers) {
                providedKey = request.headers['x-api-key'] || request.headers['X-API-KEY'];
            }

            // Mapeia customer.id para userId se necessário
            if (!request.userId && request.customer && request.customer.id) {
                request.userId = request.customer.id;
            }
            // Usa orderId como idempotencyKey se não houver
            if (!request.idempotencyKey && request.metadata && request.metadata.orderId) {
                request.idempotencyKey = request.metadata.orderId;
            }

            // 0.1 Autenticação (API Key)
            // Se o request tem apiKey, valida contra a regra.
            if (providedKey) {
                const configKey = this.rules.security.apiSecret || "";
                if (providedKey.trim() !== configKey.trim()) {
                    throw new Error("unauthorized: API Key inválida.");
                }
            } else if (!request.userId) {
                // Se não tem API Key nem User ID, verifica regras de anônimo
                if (this.rules.security.allowAnonymous) {
                    request.userId = `guest_${Date.now()}`;
                } else {
                    throw new Error("unauthorized: ID do usuário ou API Key obrigatória.");
                }
            }

            if (request.amount <= 0) throw new Error("O valor da transação deve ser positivo.");

            // 0.1 Segurança: Rate Limiting (Substituindo Auth)
            if (!this.checkRateLimit(request.userId)) {
                throw new Error("429: Muitas requisições. Tente novamente mais tarde.");
            }

            // 1. Camada de Segurança: Validação de Idempotência
            if (this.rules.security.requireIdempotencyKey && !request.idempotencyKey) {
                throw new Error("Chave de idempotência é obrigatória.");
            }
            if (this.processedTransactions.has(request.idempotencyKey)) {
                logger.info("Tentativa de transação duplicada bloqueada.", { key: request.idempotencyKey });
                return { ok: false, code: "duplicate_transaction", message: "Transação já processada." };
            }

            // 2. Validação de Regras de Negócio (Low Code)
            if (!this.rules.security.allowedCurrencies.includes(request.currency)) {
                throw new Error(`Moeda não suportada: ${request.currency}`);
            }
            if (request.amount > this.rules.security.maxTransactionAmount) {
                throw new Error("Valor excede o limite de segurança permitido.");
            }

            // 3. Seleção Dinâmica de Gateway
            const gateway = this.selectGateway(request.method);
            if (!gateway) {
                throw new Error("Nenhum gateway disponível para este método.");
            }

            logger.info(`Iniciando processamento via ${gateway.name} para usuário ${request.userId}`);

            // 4. Execução e Normalização
            let rawResult;
            try {
                rawResult = await this.executeGatewayTransaction(gateway, request);
            } catch (gwError) {
                logger.error(`Erro no gateway ${gateway.name}`, gwError);
                throw new Error(`Falha no pagamento: ${gwError.message}`);
            }

            const normalizedResponse = this.normalizeResponse(rawResult, gateway, request);

            // 5. Persistência de Idempotência
            if (normalizedResponse.success) {
                this.processedTransactions.add(request.idempotencyKey);
            }

            // 6. Persistência em Banco JSON (Log de Auditoria/Webhook)
            this.saveTransactionToDb(request, rawResult, normalizedResponse);

            return {
                ok: normalizedResponse.success,
                code: normalizedResponse.success ? "success" : "gateway_error",
                data: normalizedResponse
            };

        } catch (error) {
            // Extrai código de erro se presente na mensagem (ex: "unauthorized: ...")
            const code = error.message.includes(":") ? error.message.split(":")[0].trim() : "internal_error";

            // 6. Tratamento de Erro Seguro (Não vazar stack trace)
            if (code === 'unauthorized') {
                logger.info("Falha de autenticação", { message: error.message });
            } else {
                logger.error("Erro no processamento", error);
            }
            
            return { 
                ok: false, 
                code: code,
                message: error.message || "Erro interno no processamento." 
            };
        }
    }

    selectGateway(method) {
        const gateways = this.rules.gateways;

        // 1. Busca Específica: Se o método foi informado, tenta usar ele
        if (method && gateways[method]) {
            return gateways[method].enabled ? { name: method, config: gateways[method] } : null;
        }

        // 2. Fallback Inteligente: Busca o gateway habilitado com maior prioridade (menor número)
        const bestGateway = Object.entries(gateways)
            .filter(([_, config]) => config.enabled)
            .sort((a, b) => a[1].priority - b[1].priority)[0];

        return bestGateway ? { name: bestGateway[0], config: bestGateway[1] } : null;
    }

    async executeGatewayTransaction(gateway, request) {
        switch (gateway.name) {
            case 'infinity_pay':
                return this.processInfinityPay(request);
            case 'pix_own':
                return this.processPixOwn(request);
            default:
                return { status: 'approved', tid: `mock_${Date.now()}` };
        }
    }

    // --- Helpers de Gateway ---

    processInfinityPay(request) {
        // Simulação da API InfinityPay
        if (!request.card || !request.card.number || !request.card.cvv) {
            throw new Error("Dados do cartão incompletos.");
        }
        // Mock de resposta de sucesso
        return {
            provider: 'infinity_pay',
            tid: `inf_${Date.now()}`,
            authorization_code: Math.floor(Math.random() * 1000000).toString(),
            status: 'approved',
            amount_cents: Math.round(request.amount * 100),
            created_at: new Date().toISOString()
        };
    }

    processPixOwn(request) {
        // Geração de PIX Copia e Cola (Payload Mockado seguindo padrão EMV)
        const txId = `pix_${Date.now()}`;
        const amountStr = request.amount.toFixed(2);
        // Exemplo simplificado de estrutura EMV BR Code
        const payload = `00020126330014BR.GOV.BCB.PIX0111${txId}520400005303986540${amountStr.length}${amountStr}5802BR5909Axion Pay6009Sao Paulo62070503***6304ABCD`;
        
        return {
            provider: 'pix_own',
            txId: txId,
            payload: payload,
            expiration_seconds: 3600,
            status: 'pending'
        };
    }

    // --- Helpers de Dados e Persistência ---

    normalizeResponse(raw, gateway, request) {
        const isPix = gateway.name === 'pix_own';
        return {
            success: raw.status === 'approved' || raw.status === 'pending',
            transactionId: raw.tid || raw.txId,
            status: raw.status, // approved, pending, failed
            message: isPix ? 'Aguardando pagamento PIX' : 'Pagamento processado com sucesso',
            paymentMethod: gateway.name,
            amount: request.amount,
            currency: request.currency,
            // Se for PIX, retorna o payload, senão null
            pixPayload: isPix ? raw.payload : null,
            timestamp: new Date().toISOString()
        };
    }

    saveTransactionToDb(request, rawResponse, finalResponse) {
        const record = {
            id: finalResponse.transactionId,
            request: { ...request, card: request.card ? '***MASCARADO***' : undefined }, // Segurança: Nunca salvar cartão
            gateway_response: rawResponse,
            final_response: finalResponse,
            status: finalResponse.status,
            created_at: new Date().toISOString()
        };

        try {
            let transactions = [];
            if (fs.existsSync(this.dbPath)) {
                const fileData = fs.readFileSync(this.dbPath, 'utf8');
                transactions = fileData ? JSON.parse(fileData) : [];
            }
            transactions.push(record);
            fs.writeFileSync(this.dbPath, JSON.stringify(transactions, null, 2));
        } catch (e) {
            logger.error("Falha ao salvar transação no banco JSON", e);
        }
    }

    /**
     * Verifica se o usuário excedeu o limite de requisições.
     * Implementação simples de Fixed Window Counter.
     */
    checkRateLimit(userId) {
        const now = Date.now();
        const { windowMs, max } = this.rules.security.rateLimit;
        
        if (!this.rateLimitStore.has(userId)) {
            this.rateLimitStore.set(userId, { count: 1, expiry: now + windowMs });
            return true;
        }

        const record = this.rateLimitStore.get(userId);
        if (now > record.expiry) {
            // Janela expirou, reseta contagem
            record.count = 1;
            record.expiry = now + windowMs;
            return true;
        }

        if (record.count >= max) return false;
        
        record.count++;
        return true;
    }
}

module.exports = new PaymentProcessor();