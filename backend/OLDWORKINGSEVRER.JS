const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());

async function fetchTCGPlayerData(cardName) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });
  const page = await browser.newPage();
  const url = `https://www.tcgplayer.com/search/all/product?q=${encodeURIComponent(cardName)}&view=grid`;

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('.inventory__price-with-shipping', { timeout: 10000 });

    const cardDetails = await page.evaluate(() => {
      const prices = Array.from(document.querySelectorAll('.inventory__price-with-shipping'))
        .map(el => el.textContent.trim());
      const cardNumber = document.querySelector('.product__card-number')?.textContent.trim() || "N/A"; // Adjust selector
      const rarity = document.querySelector('.product__rarity')?.textContent.trim() || "N/A"; // Adjust selector

      return {
        prices,
        cardNumber,
        rarity
      };
    });

    return cardDetails;
  } catch (error) {
    console.error(`Error fetching TCGPlayer data: ${error}`);
    return null;
  } finally {
    await browser.close();
  }
}

async function fetchEbayData(cardName) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  const url = `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(cardName)}+psa+10&_sacat=0&LH_Sold=1&LH_Complete=1`;

  try {
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    await page.waitForSelector('.s-item__price', { timeout: 10000 });

    const psa10Prices = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('.s-item__price'))
        .map(el => el.textContent.trim());
    });

    return psa10Prices;
  } catch (error) {
    console.error(`Error fetching eBay data: ${error}`);
    return [];
  } finally {
    await browser.close();
  }
}

app.get('/api/card-data', async (req, res) => {
  const cardName = req.query.cardName;

  const tcgData = await fetchTCGPlayerData(cardName);
  const psa10Prices = await fetchEbayData(cardName);

  if (tcgData && psa10Prices) {
    const ungradedPrice = parseFloat(tcgData.prices[0].replace('$', '').replace(',', '')) || 0;
    const psaPrice = psa10Prices.length > 0 ? parseFloat(psa10Prices[0].replace('$', '').replace(',', '')) : 0;
    const profitPotential = ungradedPrice > 0 ? (((psaPrice - ungradedPrice) / ungradedPrice) * 100).toFixed(2) : "N/A";

    res.json({
      cardName,
      cardNumber: tcgData.cardNumber,
      rarity: tcgData.rarity,
      ungradedPrices: tcgData.prices,
      psa10Prices,
      profitPotential: `${profitPotential}%`
    });
  } else {
    res.status(500).json({ error: "Error fetching card data" });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});
