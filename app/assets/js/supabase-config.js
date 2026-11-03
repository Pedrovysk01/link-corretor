/* Conexão com o Supabase (painel, página do cliente em c/ e scanner). */
window.CF_SUPABASE = {
  // PRODUÇÃO — projeto "SeuCliente" no Supabase. A chave anon é pública por desenho (a segurança está nas políticas RLS e nas funções);
  // NUNCA coloque aqui a service_role / secret key nem o token pessoal (sbp_…).
  url: "https://dvenzoicrpjsfvvuapvh.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR2ZW56b2ljcnBqc2Z2dnVhcHZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0ODYyODIsImV4cCI6MjEwNzA2MjI4Mn0.KiMl5JmjO31YnIJ4CxVFFOGmi78XCdymYH0_lM6QbJs",

  // LOCAL (npx supabase start) — para usar, troque as duas linhas de cima por estas:
  // url: "http://127.0.0.1:57321",
  // anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0",
  // Modo demonstração (sem servidor, só localStorage): deixe anonKey vazio.
};

/* Busca de empresas do Google Maps (Avaliações Google e Localização). Vazio = preenchimento manual.
   1) console.cloud.google.com → ative "Places API (New)"  2) Credenciais → Criar chave de API
   3) Restrinja a chave: "Referenciadores HTTP" (o endereço deste painel) e "Places API (New)" como única API. */
window.CF_GOOGLE = { placesKey: "" };
