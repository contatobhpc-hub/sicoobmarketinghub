import { sponsorshipsStore, type Sponsorship, type SponsorshipCategory, type SponsorshipType } from "./sponsorships";

type Row = {
  event: string;
  description: string;
  city: string;
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;   // ISO yyyy-mm-dd
  value: number;
  category: SponsorshipCategory;
  notes?: string;
};

// Extraído de "CONTROLE DE PATROCINIOS" (planilha enviada em 13/07/2026).
// Verba disponível: R$ 250.000,00.
export const IMPORTED_SPONSORSHIPS: Row[] = [
  { event: "Festa de Santo Reis", description: "Paróquia Nossa Senhora das Candeias", city: "Candeias", startDate: "2026-01-11", endDate: "2026-01-11", value: 700, category: "Religioso" },
  { event: "Festa de São Sebastião", description: "Paróquia São Sebastião", city: "Campo Belo", startDate: "2026-01-16", endDate: "2026-01-25", value: 1000, category: "Religioso" },
  { event: "Festa de São Sebastião", description: "Paróquia Sebastião Santana", city: "Santana do Jacaré", startDate: "2026-01-18", endDate: "2026-01-18", value: 300, category: "Religioso" },
  { event: "Festa de São Sebastião", description: "Paróquia Nossa Senhora da Ajuda", city: "Cristais", startDate: "2026-01-24", endDate: "2026-01-25", value: 1800, category: "Religioso", notes: "Doação de Sipag's e Brindes" },
  { event: "Cenário do Agronegócio 2025/2026", description: "Sindicato dos Produtores Rurais", city: "Campo Belo", startDate: "2026-02-03", endDate: "2026-02-03", value: 1000, category: "Agronegócio" },
  { event: "5º Festival de Chopp", description: "Rotary Club", city: "Campo Belo", startDate: "2026-02-07", endDate: "2026-02-07", value: 1500, category: "Cultural" },
  { event: "Carnaval 2026", description: "Organizado por Tileoni", city: "Candeias", startDate: "2026-02-13", endDate: "2026-02-13", value: 5000, category: "Cultural" },
  { event: "Bloco Do Curinga", description: "Organizado por Fábio Rodarte", city: "Campo Belo", startDate: "2026-02-17", endDate: "2026-02-17", value: 400, category: "Cultural" },
  { event: "Doação de Oficina Squeezes", description: "Hospital Carlos Chagas de Candeias", city: "Candeias", startDate: "2026-02-23", endDate: "2026-02-23", value: 872, category: "Social" },
  { event: "AAMISC – Amigas da Santa Casa", description: "Amigas da Santa Casa", city: "Campo Belo", startDate: "2026-03-02", endDate: "2026-03-02", value: 300, category: "Social", notes: "3 kits Brindes" },
  { event: "Festa do Dia Internacional da Mulher", description: "Organizado por Daniele e Elaine", city: "Aguanil", startDate: "2026-03-07", endDate: "2026-03-07", value: 400, category: "Social" },
  { event: "4º Torneio Open Beach Tennis Aloha Beach", description: "Organizado pela Tatiana", city: "Campo Belo", startDate: "2026-03-11", endDate: "2026-03-15", value: 300, category: "Esportivo" },
  { event: "Doação de Confecções de Camisetas Sparta", description: "Organizado por José Francisco", city: "Campo Belo", startDate: "2026-03-13", endDate: "2026-03-13", value: 2000, category: "Esportivo" },
  { event: "1º Torneio Federado de Beach Tennis", description: "Organizado por Malibu", city: "Campo Belo", startDate: "2026-03-26", endDate: "2026-03-29", value: 500, category: "Esportivo" },
  { event: "Doação às crianças para visitarem o Museu de BH", description: "Assistência Social de Campo Belo", city: "Campo Belo", startDate: "2026-03-27", endDate: "2026-03-27", value: 500, category: "Social" },
  { event: "2º Autismo RUN", description: "Prefeitura de Cristais", city: "Cristais", startDate: "2026-04-11", endDate: "2026-04-11", value: 1000, category: "Social" },
  { event: "1ª Corrida Autismo em Movimento", description: "Organizado por Alexandre Xambinho", city: "Campo Belo", startDate: "2026-04-12", endDate: "2026-04-12", value: 300, category: "Esportivo" },
  { event: "Circuito Sul Mineiro da Cafeicultura", description: "Equipe da Emater", city: "Campo Belo", startDate: "2026-04-15", endDate: "2026-04-15", value: 1000, category: "Agronegócio" },
  { event: "Festa Nossa Senhora do Rosário da Gruta", description: "Associação Cultural", city: "Candeias", startDate: "2026-04-17", endDate: "2026-04-19", value: 500, category: "Religioso" },
  { event: "4ª Ziza Runners", description: "Organizado pela associada Teresinha", city: "Candeias", startDate: "2026-04-19", endDate: "2026-04-19", value: 2000, category: "Esportivo" },
  { event: "Baile para Casais - Paróquia N.S. das Candeias", description: "Organizado pelo Pe. Antonio", city: "Candeias", startDate: "2026-05-09", endDate: "2026-05-09", value: 500, category: "Religioso" },
  { event: "Bingo Beneficente em Prol de Projetos Sociais", description: "Organizado pela APAE de Candeias", city: "Candeias", startDate: "2026-05-17", endDate: "2026-05-17", value: 5000, category: "Social" },
  { event: "22º Festa do Galeto", description: "Organizado pela Loja Maçônica", city: "Campo Belo", startDate: "2026-05-23", endDate: "2026-05-23", value: 3000, category: "Cultural" },
  { event: "Festa da Família Escolas Municipais Rurais", description: "Mires Roselis de Faria Oliveira", city: "Candeias", startDate: "2026-05-23", endDate: "2026-05-23", value: 200, category: "Educacional" },
  { event: "Associação dos Amigos da Comunidade Luz e Vida", description: "Organizado por Bruno Bressani", city: "Candeias", startDate: "2026-05-28", endDate: "2026-05-28", value: 500, category: "Social" },
  { event: "Semana do Meio Ambiente", description: "Prefeitura de Campo Belo", city: "Campo Belo", startDate: "2026-05-28", endDate: "2026-05-28", value: 500, category: "Educacional" },
  { event: "Festa MAÍNA", description: "Paróquia Nossa Senhora das Mercês", city: "Campo Belo", startDate: "2026-05-30", endDate: "2026-05-30", value: 200, category: "Religioso" },
  { event: "Festival de Capoeira", description: "Festival de Capoeira", city: "Candeias", startDate: "2026-05-31", endDate: "2026-05-31", value: 200, category: "Cultural" },
  { event: "Festa Junina da APAE", description: "Organizado pela Maria Regina", city: "Campo Belo", startDate: "2026-06-06", endDate: "2026-06-06", value: 1000, category: "Social" },
  { event: "Show Beneficente", description: "Em prol da Vila Vicentina", city: "Aguanil", startDate: "2026-06-05", endDate: "2026-06-05", value: 500, category: "Social" },
  { event: "Cavalhada", description: "Organizado por Alef de Souza Dias", city: "Cana Verde", startDate: "2026-06-06", endDate: "2026-06-07", value: 700, category: "Cultural" },
  { event: "Festa Junina da Vila Vicentina", description: "Organizado pelo presidente Sebastião", city: "Campo Belo", startDate: "2026-06-12", endDate: "2026-06-14", value: 8000, category: "Social" },
  { event: "Festa Vila Vicentina de Cristais", description: "Organizado por Maria Aparecida Chagas", city: "Cristais", startDate: "2026-06-12", endDate: "2026-06-13", value: 700, category: "Social" },
  { event: "Jogo do Brasil", description: "Jogo do Brasil", city: "Santana do Jacaré", startDate: "2026-06-13", endDate: "2026-06-13", value: 200, category: "Esportivo" },
  { event: "Doação de Forno Elétrico para Hospital de Cristais", description: "Organizado por Antonio Sergio Maia", city: "Cristais", startDate: "2026-06-15", endDate: "2026-06-15", value: 1085.61, category: "Social" },
  { event: "Doação de Canetas para o Chá Beneficente - AAMIS", description: "Organizado por Maria Isabel Parreira", city: "Campo Belo", startDate: "2026-06-18", endDate: "2026-06-18", value: 0, category: "Social" },
  { event: "Arraial de Nossa Senhora do Carmo", description: "Organizado pelo Pe. Thiago Araújo Oliveira", city: "Campo Belo", startDate: "2026-06-19", endDate: "2026-06-21", value: 1000, category: "Religioso" },
  { event: "Moto Grupo Route Mountain", description: "Alexandre Moreira e Claudio José Rezende", city: "Campo Belo", startDate: "2026-06-20", endDate: "2026-06-20", value: 1500, category: "Esportivo" },
  { event: "6º Arraiá das Mercês", description: "Paróquia Nossa Senhora das Mercês", city: "Campo Belo", startDate: "2026-06-27", endDate: "2026-06-27", value: 700, category: "Religioso" },
  { event: "Associação Comunitária do Porto dos Mendes - AC", description: "Alexander Vaz e Edima", city: "Campo Belo", startDate: "2026-06-28", endDate: "2026-06-28", value: 300, category: "Social" },
  { event: "Bingo Beneficente", description: "Hospital Carlos Chagas", city: "Candeias", startDate: "2026-06-28", endDate: "2026-06-28", value: 10000, category: "Social" },
  { event: "3ª Edição do Campeonato de Basquete 3x3", description: "Lucas Souza - Praça de Esportes", city: "Campo Belo", startDate: "2026-07-04", endDate: "2026-07-05", value: 0, category: "Esportivo", notes: "Brindes" },
  { event: "5ª Corrida Rústica e 1º Pedal Solidário", description: "Rotary Clube de Cristais", city: "Cristais", startDate: "2026-07-05", endDate: "2026-07-05", value: 1592, category: "Esportivo" },
  { event: "Arraiá da Família Caipira - CEMEI Prefeito Ananias", description: "Deolira Rosário de Sena Borges", city: "Campo Belo", startDate: "2026-07-10", endDate: "2026-07-10", value: 200, category: "Educacional" },
  { event: "Show Beneficente", description: "Paróquia Nossa Senhora das Mercês", city: "Campo Belo", startDate: "2026-07-12", endDate: "2026-07-12", value: 500, category: "Religioso" },
  { event: "Arraiá São Sebastião", description: "Paróquia São Sebastião - Davis", city: "Campo Belo", startDate: "2026-07-10", endDate: "2026-07-12", value: 1621, category: "Religioso" },
  { event: "Rodeio na Comunidade do Ribeirão Santo Antônio", description: "Cleidiane Aparecida Lemes do Vale", city: "Campo Belo", startDate: "2026-07-17", endDate: "2026-07-19", value: 500, category: "Cultural" },
  { event: "7º Arraiá Nossa Senhora da Ajuda", description: "Paróquia Nossa Senhora da Ajuda", city: "Cristais", startDate: "2026-07-17", endDate: "2026-07-17", value: 2000, category: "Religioso" },
  { event: "Festa Social de Nossa Senhora das Candeias", description: "Paróquia Nossa Senhora das Candeias", city: "Candeias", startDate: "2026-07-31", endDate: "2026-08-02", value: 500, category: "Religioso" },
  { event: "Rodeio Fest 2026", description: "Cia de Rodeios Velho Oeste (Anderson)", city: "Santana do Jacaré", startDate: "2026-08-07", endDate: "2026-08-07", value: 1000, category: "Cultural" },
  { event: "Associação de Romeiros a Pé de Campo Belo a Aparecida", description: "Organização Geraldo Donizete", city: "Campo Belo", startDate: "2026-08-14", endDate: "2026-08-25", value: 300, category: "Religioso" },
];

function inferType(v: number): SponsorshipType {
  if (v >= 8000) return "Master";
  if (v >= 3000) return "Ouro";
  if (v >= 1500) return "Prata";
  if (v >= 500) return "Bronze";
  if (v > 0) return "Apoio";
  return "Permuta";
}

const dedupeKey = (s: { event: string; startDate: string; city: string }) =>
  `${s.event.trim().toLowerCase()}|${s.startDate}|${s.city.trim().toLowerCase()}`;

export function importSponsorshipsFromSheet(): { added: number; skipped: number } {
  const existing = new Set(sponsorshipsStore.get().map((s) => dedupeKey(s)));
  let added = 0;
  let skipped = 0;
  for (const row of IMPORTED_SPONSORSHIPS) {
    if (existing.has(dedupeKey(row))) { skipped++; continue; }
    const patch: Partial<Sponsorship> & Pick<Sponsorship, "institution" | "event" | "city" | "category" | "type" | "value" | "owner"> = {
      institution: row.description,
      event: row.event,
      city: row.city,
      category: row.category,
      type: inferType(row.value),
      value: row.value,
      owner: "Bruno",
      startDate: row.startDate,
      endDate: row.endDate,
      status: "Confirmado",
      notes: row.notes ?? "",
    };
    sponsorshipsStore.add(patch);
    added++;
  }
  return { added, skipped };
}
