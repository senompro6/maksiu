const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalXZ = goals.GoalXZ;
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => { 
  console.log('=> Ktoś (lub UptimeRobot) odwiedził stronę WWW bota!');
  res.send('maksiu zyje i dziala!'); 
});
app.listen(PORT, () => { console.log(`Serwer HTTP ruszył na porcie ${PORT}`); });

let czyZarejestrowany = false;
let naAnarchii = false;

function stworzBota() {
  console.log('=== URUCHAMIAM PROCEDURĘ LOGOWANIA DO MINECRAFT ===');
  console.log('Próba połączenia z craftmc.pl na nick maksiu...');
  
  const bot = mineflayer.createBot({
    host: 'craftmc.pl',
    port: 25565,
    username: 'maksiu',
    version: '1.20.4'
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log('!!! SUKCES: maksiu wszedł fizycznie na serwer !!!');
    setTimeout(() => {
      if (!czyZarejestrowany) {
        console.log('Wysyłam: /register cwel cwel');
        bot.chat('/register cwel cwel');
        czyZarejestrowany = true;
      } else {
        console.log('Wysyłam: /login cwel');
        bot.chat('/login cwel');
        setTimeout(() => { idzIKliknijKompas(bot); }, 4000);
      }
    }, 3000);
  });

  // --- NOWA LOGIKA: PODGLĄD CZATU I WIADOMOŚCI SYSTEMOWYCH ---
  
  // Przechwytywanie zwykłych wiadomości od graczy
  bot.on('chat', (username, message) => {
    // Ignoruj wiadomości wysyłane przez samego maksia, żeby nie robić spamu
    if (username === bot.username) return; 
    console.log(`[CZAT] <${username}> ${message}`);
  });

  // Przechwytywanie komunikatów systemowych (wejścia graczy, komendy, ogłoszenia serwera)
  bot.on('message', (jsonMsg) => {
    const tekst = jsonMsg.toString().trim();
    
    // Ignorujemy puste linijki
    if (!tekst) return; 
    
    // Filtrujemy logowanie, żeby nie powtarzać zwykłego czatu w konsoli
    if (tekst.startsWith('<') && tekst.includes('>')) return; 

    console.log(`[SERWER] ${tekst}`);
  });

  // -----------------------------------------------------------

  bot.on('windowOpen', async (window) => {
    console.log('Wykryto otwarte menu GUI. Szukam jabłka...');
    const slotJabłka = window.slots.findIndex((item, index) => {
      return item && item.name === 'apple' && index < window.inventoryStart;
    });
    if (slotJabłka !== -1) {
      console.log(`Klikam czerwone jabłko na slocie: ${slotJabłka}`);
      await bot.clickWindow(slotJabłka, 0, 0);
    }
  });

  bot.on('respawn', () => {
    console.log('Maksiu zmienił świat (respawn). Sprawdzam czy to Anarchia...');
    if (!naAnarchii) {
      naAnarchii = true;
      console.log('Wykryto Anarchię! Czekam 3 sekundy na /rtp...');
      setTimeout(() => { bot.chat('/rtp'); }, 3000);
    }
  });

  bot.on('kicked', (reason) => {
    console.log(`!!! BOT WYRZUCONY Z SERWERA !!! Powód: ${reason}`);
    naAnarchii = false;
    console.log('Restart bota za 5 sekund...');
    setTimeout(stworzBota, 5000);
  });

  bot.on('error', (err) => {
    console.log('!!! WYSTĄPIŁ BŁĄD POŁĄCZENIA !!!');
    console.error(err);
  });
}

async function idzIKliknijKompas(bot) {
  const mcData = require('minecraft-data')(bot.version);
  const movements = new Movements(bot, mcData);
  bot.pathfinder.setMovements(movements);
  const pozycjaStartowa = bot.entity.position;
  const kierunekX = -Math.sin(bot.entity.yaw);
  const kierunekZ = -Math.cos(bot.entity.yaw);
  const celX = Math.round(pozycjaStartowa.x + (kierunekX * 10));
  const celZ = Math.round(pozycjaStartowa.z + (kierunekZ * 10));
  try {
    await bot.pathfinder.goto(new GoalXZ(celX, celZ));
    const kompas = bot.inventory.items().find(item => item.name === 'compass');
    if (kompas) { await bot.equip(kompas, 'hand'); bot.activateItem(); }
    else { bot.activateItem(); }
  } catch (err) {}
}

stworzBota();
