/**
 * Serviço de Integração com a API Xtream UI (Alessandro)
 * Este serviço centraliza todas as chamadas para a API externa.
 */

const BASE_URL = process.env.XTREAM_API_URL;
const API_KEY = process.env.XTREAM_API_KEY;

export async function fetchXtreamApi(action: string, params: Record<string, string | number> = {}) {
  if (!BASE_URL || !API_KEY) {
    throw new Error("Configurações da API Xtream (URL ou Key) não encontradas no .env");
  }

  // Limpa a URL base para evitar barras duplas e garante que termine com /
  const cleanBaseUrl = BASE_URL.endsWith("/") ? BASE_URL : `${BASE_URL}/`;
  
  // Monta a query string manualmente para garantir o formato exato
  const queryParams = new URLSearchParams({
    api_key: API_KEY,
    action: action,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)]))
  });

  const fullUrl = `${cleanBaseUrl}?${queryParams.toString()}`;

  try {
    // No servidor, podemos usar o agente para ignorar SSL se necessário
    // No Next.js 15+ com fetch nativo, usamos esta variável de ambiente global se o servidor for instável
    if (process.env.NODE_ENV === "development") {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    }

    const response = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
      // Desabilitamos o cache temporariamente para debugar
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Erro na API Xtream: ${response.status} ${response.statusText}`);
    }

    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      // Se não for JSON, pode ser que a API retornou erro em texto
      console.error("Resposta não é JSON:", text);
      throw new Error("A API não retornou um JSON válido.");
    }
  } catch (error) {
    console.error(`Erro ao chamar action ${action}:`, error);
    throw error;
  }
}

// Exemplo de funções específicas
export const xtreamService = {
  getMovies: () => fetchXtreamApi("get_movies"),
  getUsers: () => fetchXtreamApi("get_users"),
  getPackages: () => fetchXtreamApi("get_packages"),
  getSeries: () => fetchXtreamApi("get_series_list"),
  
  // Exemplo de criação de usuário (requer parâmetros extras na API)
  createUser: (userData: any) => fetchXtreamApi("create_user", userData),
  
  // Função genérica para qualquer comando da lista do Alessandro
  executeAction: (action: string, params?: any) => fetchXtreamApi(action, params),
};
