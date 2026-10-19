// Cláudio | Financeiro LOOP — bot de script do WorkAdventure.
// Ouve o chat da bolha, manda cada mensagem para a planilha (Apps Script) e responde.
// Endereço e chave ficam fora deste arquivo. No WorkAdventure, em "Custom hash parameters":
//   api=URL_DO_APP_DA_WEB_CODIFICADA&token=SUA_CHAVE

const OI = 'Oi! Sou o Cláudio, do financeiro. Me conte os gastos e recebimentos do dia, por exemplo: ' +
  '"paguei 85 de almoço no pix" ou "recebi 1.200 do cliente Acme". Também respondo "qual o saldo de hoje?".';

async function run(metadata) {
  console.log('Cláudio: iniciando', metadata);
  try { await WA.onInit(); } catch (e) { console.log('Cláudio: onInit falhou', e); }
  const hash = WA.room.hashParameters || {};
  const api = decodeURIComponent(hash.api || '');
  const token = hash.token;
  console.log('Cláudio: api configurada?', !!api, 'token?', !!token);
  const bolha = { scope: 'bubble' };
  const dizer = (t) => WA.chat.sendChatMessage(t, bolha);

  // Fica na porta do "Setor Financeiro", do lado de fora: dentro da área restrita o bot é desconectado.
  // Com posicao=dentro nos hash params, volta para dentro da área.
  try {
    const nome = decodeURIComponent(hash.area || 'Setor Financeiro');
    const areas = await WA.mapEditor.area.list();
    const a = areas.find((x) => x.name === nome);
    if (a) {
      const x = Math.round(a.x + a.width / 2);
      const y = hash.posicao === 'dentro'
        ? Math.round(a.y + a.height - 16) // frente da mesa, perto da borda de baixo
        : Math.round(a.y - 24); // corredor, logo acima da borda de cima da área
      try { await WA.player.teleport(x, y); } catch (e) { await WA.player.moveTo(x, y, 10); }
      console.log('Cláudio: posicionado em', nome, x, y);
    } else {
      console.log('Cláudio: área não encontrada', nome);
    }
  } catch (e) { console.log('Cláudio: não consegui ir para a área', e); }

  WA.player.proximityMeeting.onJoin().subscribe(() => dizer(OI));

  WA.chat.onChatMessage(async (mensagem, evento) => {
    if (!evento || !evento.author) return; // ignora as próprias mensagens
    console.log('Cláudio: mensagem de', evento.author.name);
    if (!api || !token) { dizer('Estou sem a configuração da planilha. Peça para ajustar os parâmetros do bot.'); return; }
    WA.chat.startTyping(bolha);
    try {
      const r = await fetch(api, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // evita preflight de CORS no Apps Script
        body: JSON.stringify({ token, texto: mensagem, autor: evento.author.name || '' }),
      });
      const j = await r.json();
      if (j.resposta) dizer(j.resposta);
    } catch (e) {
      console.log('Cláudio: erro ao falar com a planilha', e);
      dizer('Não consegui falar com a planilha agora. Tente de novo em instantes.');
    } finally {
      WA.chat.stopTyping(bolha);
    }
  }, bolha);

  // Mantém a conexão ativa: sem movimento, o WorkAdventure desconecta o bot depois de alguns minutos.
  let lado = 1;
  setInterval(async () => {
    try {
      const p = await WA.player.getPosition();
      lado = -lado;
      await WA.player.teleport(Math.round(p.x) + lado, Math.round(p.y));
    } catch (e) { console.log('Cláudio: passo de presença falhou', e); }
  }, 60000);

  // Os ouvidores acima seguem ativos depois que run() termina (padrão dos bots do WorkAdventure).
  console.log('Cláudio: pronto');
}

// O WorkAdventure chama o run() do export default.
export default { run };
