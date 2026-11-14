# Guia de Configuração: Supabase + ViagemSmart

> **Status: proposta, não implementada.** Hoje o app salva tudo em `data/tripState.local.json` (veja o README). Este guia foi escrito quando os dados ainda ficavam no localStorage e fica aqui como referência para uma futura migração.

Este guia descreve os passos necessários para conectar a aplicação ViagemSmart ao **Supabase**, transformando o armazenamento local (localStorage) em um banco de dados persistente na nuvem.

## 1. Criar conta e projeto no Supabase
1. Acesse [supabase.com](https://supabase.com/) e crie uma conta gratuita.
2. Clique em **"New Project"**.
3. Escolha um nome (ex: `ViagemSmart-DB`), defina uma senha segura para o banco e selecione a região mais próxima.
4. Aguarde o provisionamento do banco de dados (leva cerca de 1-2 minutos).

## 2. Configurar a Tabela de Gastos (SQL)
No painel do Supabase, vá em **"SQL Editor"** e execute o seguinte comando para criar a estrutura necessária:

```sql
-- Tabela de Gastos
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  currency_code TEXT NOT NULL,
  converted_amount_brl DECIMAL NOT NULL,
  expense_date DATE NOT NULL,
  end_date DATE,
  category TEXT NOT NULL,
  city_id UUID,
  user_ids UUID[] -- Array de IDs de usuários
);

-- Tabela de Usuários
CREATE TABLE travel_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Tabela de Cidades
CREATE TABLE travel_cities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country TEXT NOT NULL
);
```

## 3. Instalação e Inicialização do Cliente
Adicione a dependência do SDK do Supabase ao seu projeto:

```bash
npm install @supabase/supabase-js
```

Crie um arquivo de serviço (ex: `src/services/supabaseClient.ts`):

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'SUA_SUPABASE_URL';
const supabaseAnonKey = 'SUA_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

## 4. Substituir localStorage por Chamadas API
No seu `App.tsx`, você deve trocar a lógica de persistência. Exemplo de como buscar gastos:

```typescript
// Exemplo de busca de dados
const fetchExpenses = async () => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('expense_date', { ascending: false });
    
  if (data) setState(prev => ({ ...prev, expenses: data }));
};

// Exemplo de inserção
const addExpense = async (newExpense: any) => {
  const { data, error } = await supabase
    .from('expenses')
    .insert([newExpense])
    .select();
    
  if (data) {
     // Atualizar estado local ou refetch
  }
};
```

## 5. Próximos Passos Recomendados
*   **Autenticação**: Use o Supabase Auth para permitir que múltiplos grupos tenham suas próprias viagens isoladas.
*   **Row Level Security (RLS)**: Configure políticas de segurança para que um usuário só consiga ler os gastos da sua própria viagem.
*   **Realtime**: Ative o Realtime no banco de dados para que, quando um amigo adicionar um gasto, o valor apareça instantaneamente no seu Dashboard sem precisar dar Refresh.

---
*Dica: Lembre-se de nunca expor sua `SERVICE_ROLE_KEY` no frontend, use apenas a `ANON_KEY`.*
