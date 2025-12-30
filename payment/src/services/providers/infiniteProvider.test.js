import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// 1. Definir mocks antes dos imports (ESM)
jest.unstable_mockModule('../../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

// 2. Importar o modulo sob teste dinamicamente
const { createCardTransactionWithInfinite } = await import('./infiniteProvider.js');

// Mock do fetch global
global.fetch = jest.fn();

describe('InfiniteProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve enviar o payload correto para a API da InfinitePay', async () => {
    // Arrange: Simula resposta de sucesso da API
    const mockResponseData = { id: 'link-123', url: 'https://pay.infinite.io/123' };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockResponseData,
      status: 201
    });

    const input = {
      amount_cents: 25000,
      customer: {
        name: 'João Silva',
        email: 'joao@email.com',
        document: '11122233344'
      },
      metadata: {
        transactionId: 'tx-abc-123'
      }
    };

    // Act
    const result = await createCardTransactionWithInfinite(input);

    // Assert
    expect(result.success).toBe(true);
    expect(result.providerReference).toBe('link-123');
    
    // Verifica se a URL e Headers estao corretos
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.infinitepay.io/invoices/public/checkout/links',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })
    );

    // Verifica o corpo da requisicao (Payload)
    const callBody = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(callBody.handle).toBe('annetom');
    expect(callBody.order_nsu).toBe('tx-abc-123');
    expect(callBody.items[0].price).toBe(25000);
    expect(callBody.customer.name).toBe('João Silva');
    expect(callBody.redirect_url).toBe('https://seusite.com/obrigado');
  });

  it('deve retornar erro se a API falhar', async () => {
    global.fetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid data' })
    });

    const result = await createCardTransactionWithInfinite({
      amount_cents: 1000,
      metadata: { transactionId: 'tx-err' }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid data');
  });
});