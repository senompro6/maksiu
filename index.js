const mineflayer = require('mineflayer');
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder');
const GoalXZ = goals.GoalXZ;
const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => { res.send('maksiu zyje i dziala!'); });
app.listen(PORT, () => { console.log(`Serwer HTTP ruszył na porcie ${PORT}`); });

let czyZarejestrowany = false;
let naAnarchii = false;

function stworzBota() {
  console.log('Uruchamiam bota maksiu...');
  const bot = mineflayer.createBot({
    host: 'craftmc.pl',
    port: 25565,
    username: 'maksiu',
    version: '1.20.4'
  });

  bot.loadPlugin(pathfinder);

  bot.once('spawn', () => {
    console.log('maksiu wszedł na serwer!');
    setTimeout(() => {
      if (!czyZarejestrowany) {
        console.log('Rejestracja...');
        bot.chat('/register cwel cwel');
        czyZarejestrowany = true;
      } else {
        console.log('Logowanie...');
        bot.chat('/login cwel');
        setTimeout(() => { idzIKliknijKompas(bot); }, 4000);
      }
    }, 3000);
  });

  bot.on('windowOpen', async (window) => {
    const slotJabłka = window.slots.findIndex((item, index) => {
      return item && item.name === 'apple' && index < window.inventoryStart;
    });
    if (slotJabłka !== -1) {
      await bot.clickWindow(slotJabłka, 0, 0);
    }
  });

  bot.on('respawn', () => {
    if (!naAnarchii) {
      naAnarchii = true;
      setTimeout(() => { bot.chat('/rtp'); }, 3000);
    }
  });

  bot.on('kicked', (reason) => {
    naAnarchii = false;
    setTimeout(stworzBota, 5000);
  });

  bot.on('error', (err) => console.error(err));
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
