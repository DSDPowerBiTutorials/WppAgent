/**
 * Mapeamento de aliases/variações de nomes de especialidades médicas.
 *
 * Chave: nome canônico da especialidade no Clínica Conecta (case-insensitive na busca).
 * Valor: lista de variações, abreviações, nomes informais, títulos profissionais.
 *
 * Usado para resolver quando o modelo (ou paciente) usa um nome informal
 * e a busca direta não encontra profissionais.
 */

const SPECIALTY_ALIASES: Record<string, string[]> = {
  // ── Especialidades médicas principais ────────────────────
  "Acupuntura": ["acupunturista"],
  "Alergia e Imunologia": ["alergista", "imunologista", "alergia", "imunologia", "alergologia"],
  "Angiologia": ["angiologista", "angio"],
  "Cardiologia": ["cardiologista", "cardio", "coração"],
  "Cirurgia de Cabeça e Pescoço": ["cirurgião de cabeça e pescoço", "cabeça e pescoço", "cirurgia cabeça pescoço"],
  "Cirurgia do Aparelho Digestório": ["cirurgião do aparelho digestório", "cirurgia digestiva", "aparelho digestório", "cirurgia digestório"],
  "Cirurgia e Traumatologia Buco": ["cirurgia buco", "bucomaxilo", "buco maxilo", "cirurgia bucomaxilofacial"],
  "Cirurgia Geral": ["cirurgião geral", "cirurgião", "cirurgia"],
  "Cirurgia Pediátrica": ["cirurgião pediátrico", "cirurgia infantil", "cirurgião infantil"],
  "Cirurgia Plástica": ["cirurgião plástico", "plástica", "plastica"],
  "Cirurgia Torácica": ["cirurgião torácico", "tórax", "torax"],
  "Cirurgia Vascular": ["cirurgião vascular", "vascular"],
  "Cirurgião do Aparelho Digestivo": ["cirurgia digestiva", "aparelho digestivo"],
  "Cirurgião-dentista": ["dentista", "cirurgião dentista"],
  "Clínica da dor": ["dor", "tratamento da dor", "clínica de dor", "medicina da dor"],
  "Clínica Geral": ["clínico geral", "clínico", "médico geral", "cg", "clinica geral", "generalista", "clinico geral", "clinico"],
  "Clínica Médica": ["clínica médica", "clinica medica", "médico clínico", "medico clinico", "internista"],
  "Coloproctologia": ["coloproctologista", "proctologista", "proctologia", "procto"],
  "Dermatologia": ["dermatologista", "derma", "pele", "dermato"],
  "Ecocardiograma": ["eco", "ecocardiografia", "ecocardiografista", "eco cardio"],
  "Ecografia": ["ecografista", "ultrassom", "eco"],
  "Eletroencefalograma": ["eeg", "eletroencefalo"],
  "Endocrinologia e Metabologia": ["endocrinologista", "endocrino", "endócrinologia", "metabologia", "metabologista", "endocrinologia"],
  "Endocrinologia Pediátrica": ["endocrino pediátrico", "endocrinologista infantil", "endocrino infantil"],
  "Endodontia": ["endodontista", "canal", "tratamento de canal"],
  "Endoscopia": ["endoscopista", "endoscopia digestiva"],
  "Enfermagem": ["enfermeiro", "enfermeira"],
  "Estética": ["esteticista", "estética facial", "estética corporal"],
  "Estomatologia": ["estomatologista"],
  "Fisiatria": ["fisiatra", "médico fisiatra"],
  "Fisioterapia": ["fisioterapeuta", "fisio"],
  "Fisioterapia Dermatofuncional": ["fisio dermatofuncional", "fisioterapia dermatologica"],
  "Fisioterapia Neurofuncional": ["fisio neurofuncional"],
  "Fisioterapia Neurológica": ["fisio neurológica", "fisio neuro", "fisioterapia neuro", "fisioterapeuta neurológico"],
  "Fisioterapia Ortopédica": ["fisio ortopédica", "fisio orto", "fisioterapia ortopedica"],
  "Fisioterapia Pediátrica": ["fisio pediátrica", "fisio infantil", "fisioterapia infantil"],
  "Fisioterapia Pélvica": ["fisio pélvica", "fisio pelvica", "uroginecologia funcional"],
  "Fisioterapia Respiratória": ["fisio respiratória", "fisio pulmonar"],
  "Fisioterapia Saúde da mulher": ["fisio saúde da mulher", "fisioterapia feminina"],
  "Fonoaudiologia": ["fonoaudiólogo", "fonoaudióloga", "fono"],
  "Gastroenterologia": ["gastroenterologista", "gastro", "estômago", "gastrointestinal"],
  "Gastroenterologia Pediátrica": ["gastro pediátrico", "gastro infantil", "gastroenterologista infantil"],
  "Genética médica": ["geneticista", "genética"],
  "Geriatria": ["geriatra", "médico de idoso", "idoso"],
  "Ginecologia": ["ginecologista", "gineco", "go"],
  "Ginecologia (Pré-Natal)": ["pré-natal", "prenatal", "pre natal", "acompanhamento gestacional", "obstetrícia", "obstetricia", "obstetra"],
  "Harmonização Orofacial": ["hof", "harmonização facial", "harmonização"],
  "Hematologia e Hemoterapia": ["hematologista", "hematologia", "hemoterapia", "sangue"],
  "Hepatologia": ["hepatologista", "fígado", "figado"],
  "Homeopatia": ["homeopata"],
  "Implantodontia": ["implantodontista", "implante dentário", "implante dental", "implante"],
  "Infectologia": ["infectologista", "infecto"],
  "Laboratório": ["lab", "exames", "exames laboratoriais", "exame de sangue"],
  "Mastologia": ["mastologista", "mama", "mamas"],
  "Medicina Canábica": ["canábica", "cannabis medicinal", "medicina cannabis"],
  "Medicina de Família e Comunidade": ["médico de família", "medicina familiar", "médico da família"],
  "Medicina de Urgência e Emergência": ["urgência", "emergência", "pronto socorro", "urgencia", "emergencia"],
  "Medicina do Sono": ["médico do sono", "sono", "polissonografia"],
  "Medicina do Trabalho": ["médico do trabalho", "medicina ocupacional", "aso"],
  "Medicina do Tráfego": ["médico do tráfego", "detran"],
  "Medicina Esportiva": ["médico esportivo", "esportiva", "medicina do esporte"],
  "Medicina Estética": ["médico esteticista", "medicina estética"],
  "Medicina Física e Reabilitação": ["reabilitação", "medicina física", "reabilitacao"],
  "Medicina Funcional": ["médico funcional"],
  "Medicina Integrativa": ["médico integrativo", "integrativa"],
  "Medicina Intensiva": ["intensivista", "uti", "terapia intensiva"],
  "Medicina Nuclear": ["nuclear"],
  "Nefrologia": ["nefrologista", "nefro", "rim", "rins"],
  "Nefrologia Pediátrica": ["nefro pediátrico", "nefrologista infantil"],
  "Neonatologia": ["neonatologista", "neonato", "recém-nascido"],
  "Neurocirurgia": ["neurocirurgião", "cirurgia neurológica"],
  "Neurologia": ["neurologista", "neuro"],
  "Neuropediatria": ["neuropediatra", "neuro infantil", "neurologista infantil"],
  "Neuropsicologia": ["neuropsicólogo", "neuropsicóloga"],
  "Nutricionista": ["nutrição", "nutri", "nutricionista clínico"],
  "Nutrição Clínica": ["nutricionista clínica", "nutri clínica"],
  "Nutrição esportiva": ["nutricionista esportivo", "nutri esportiva"],
  "Nutrologia": ["nutrólogo", "nutrologa"],
  "Odontologia": ["dentista", "odontólogo"],
  "Odontopediatria": ["odontopediatra", "dentista infantil", "dentista de criança"],
  "Oftalmologia": ["oftalmologista", "oftalmo", "olho", "olhos", "vista", "oculista"],
  "Oftalmopediatria": ["oftalmo infantil", "oftalmologista infantil"],
  "Oncologia Pélvica": ["oncologista pélvico", "oncologia"],
  "Ortodontia": ["ortodontista", "aparelho dentário", "aparelho dental"],
  "Ortodontia e Ortopedia Facial": ["ortopedia facial", "ortodontia facial"],
  "Ortopedia": ["ortopedista", "orto", "osso", "ossos"],
  "Ortopedia e Traumatologia": ["ortopedista", "ortopedia", "orto", "traumatologia", "traumatologista", "traumato", "osso", "ossos", "fratura"],
  "Osteopatia": ["osteopata"],
  "Otorrinolaringologia": ["otorrino", "otorrinolaringologista", "ouvido", "nariz", "garganta", "orl"],
  "Pediatria": ["pediatra", "médico de criança", "criança", "infantil"],
  "Periodontia": ["periodontista", "gengiva"],
  "Pneumologia": ["pneumologista", "pulmão", "pulmao", "pneumo"],
  "Pneumologista Pediátrica": ["pneumo infantil", "pneumologista infantil"],
  "Proctologia": ["proctologista", "procto"],
  "Pronto Atendimento": ["pa", "pronto socorro", "urgência"],
  "Pronto Atendimento Pediátrico": ["pa pediátrico", "pronto socorro infantil", "urgência infantil"],
  "Prótese Dentária": ["protesista", "prótese dental", "protese"],
  "Psicanálise": ["psicanalista"],
  "Psicologia": ["psicólogo", "psicóloga", "psico"],
  "Psicologia Comportamental": ["tcc", "comportamental", "psicólogo comportamental"],
  "Psicologia infantil": ["psicólogo infantil", "psicóloga infantil", "psicologia de criança"],
  "Psicopedagogia": ["psicopedagogo", "psicopedagoga"],
  "Psiquiatria": ["psiquiatra"],
  "Psiquiatria Pediátrica": ["psiquiatra infantil", "psiquiatria infantil"],
  "Quiropraxia": ["quiroprático", "quiro"],
  "Radiologia e Diagnóstico por Imagem": ["raio x", "raio-x", "rx", "radiologia", "radiologista", "diagnóstico por imagem"],
  "Radioterapia": ["radioterapeuta"],
  "Reumatologia": ["reumatologista", "reumato", "reumatismo"],
  "Terapia Ocupacional": ["terapeuta ocupacional", "to"],
  "Ultrassonografia": ["ultra", "ultrassom", "usg", "ultrassonografia", "ultrassonografista"],
  "Urologia": ["urologista", "uro"],
  "Urologia Pediátrica": ["urologista infantil", "uro infantil"],
  "Vacinação": ["vacina", "vacinas"],
};

/**
 * Normaliza uma string removendo acentos e convertendo para minúsculas.
 */
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Dado um termo de busca (ex: "ortopedista", "orto", "ortopedia"),
 * retorna os IDs das especialidades do Clínica Conecta que combinam,
 * usando o mapa de aliases + busca por substring no nome canônico.
 */
export function findMatchingSpecialtyIds(
  searchTerm: string,
  allSpecialties: Array<{ id: string; name: string }>
): string[] {
  const term = normalize(searchTerm.trim());
  if (!term) return [];

  const matchedIds = new Set<string>();

  for (const spec of allSpecialties) {
    const specNorm = normalize(spec.name);

    // 1. Exact match
    if (specNorm === term) {
      matchedIds.add(spec.id);
      continue;
    }

    // 2. Substring: spec name contains search term or vice versa
    if (specNorm.includes(term) || term.includes(specNorm)) {
      matchedIds.add(spec.id);
      continue;
    }

    // 3. Check alias map
    const aliases = SPECIALTY_ALIASES[spec.name];
    if (aliases) {
      const match = aliases.some((alias) => {
        const aliasNorm = normalize(alias);
        return aliasNorm === term || aliasNorm.includes(term) || term.includes(aliasNorm);
      });
      if (match) {
        matchedIds.add(spec.id);
      }
    }
  }

  return Array.from(matchedIds);
}

/**
 * Dado o ID de uma especialidade que retornou 0 profissionais,
 * encontra especialidades relacionadas (por nome similar) para tentar novamente.
 * Exclui o ID original da lista retornada.
 */
export function findRelatedSpecialtyIds(
  originalSpecId: string,
  allSpecialties: Array<{ id: string; name: string }>
): string[] {
  const original = allSpecialties.find((s) => s.id === originalSpecId);
  if (!original) return [];

  // Extract significant words from the name (3+ chars)
  const words = normalize(original.name)
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !["de", "do", "da", "dos", "das", "para", "com", "por", "em"].includes(w));

  const matchedIds = new Set<string>();

  for (const spec of allSpecialties) {
    if (spec.id === originalSpecId) continue;
    const specNorm = normalize(spec.name);

    // Check if any significant word from the original appears in this specialty name
    if (words.some((word) => specNorm.includes(word))) {
      matchedIds.add(spec.id);
    }

    // Also check aliases of the original name against this specialty
    const originalAliases = SPECIALTY_ALIASES[original.name];
    if (originalAliases) {
      for (const alias of originalAliases) {
        const aliasNorm = normalize(alias);
        if (specNorm.includes(aliasNorm) || aliasNorm.includes(specNorm)) {
          matchedIds.add(spec.id);
        }
      }
    }
  }

  return Array.from(matchedIds);
}
