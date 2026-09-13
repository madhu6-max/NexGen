const { run, query } = require('./database');

const crops = [
    {
        id: 'crop_tomato',
        name: 'Tomato',
        category: 'Vegetables',
        variety: 'Vaishnavi / Hybrid S-4',
        season: 'Kharif / Rabi',
        yield: 12000,
        price: 28.0,
        min_p: 24.0,
        max_p: 34.0,
        trend: 'increasing',
        f_min: 27.0,
        f_max: 32.0,
        img: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=600&auto=format&fit=crop&q=80'
    },
    {
        id: 'crop_rice',
        name: 'Paddy Rice',
        category: 'Cereals & Grains',
        variety: 'BPT 5204 (Samba Masuri)',
        season: 'Kharif',
        yield: 2500,
        price: 26.5,
        min_p: 23.0,
        max_p: 29.0,
        trend: 'stable',
        f_min: 25.5,
        f_max: 28.0,
        img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80'
    },
    {
        id: 'crop_chilli',
        name: 'Red Chilli',
        category: 'Spices',
        variety: 'Guntur Sannam (S4)',
        season: 'Rabi',
        yield: 1800,
        price: 215.0,
        min_p: 190.0,
        max_p: 240.0,
        trend: 'increasing',
        f_min: 210.0,
        f_max: 235.0,
        img: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?w=600&auto=format&fit=crop&q=80'
    },
    {
        id: 'crop_banana',
        name: 'Banana',
        category: 'Fruits',
        variety: 'Grand Naine (G9)',
        season: 'Perennial',
        yield: 35000,
        price: 18.0,
        min_p: 14.0,
        max_p: 22.0,
        trend: 'increasing',
        f_min: 17.0,
        f_max: 21.0,
        img: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=600&auto=format&fit=crop&q=80'
    },
    {
        id: 'crop_mango',
        name: 'Mango',
        category: 'Fruits',
        variety: 'Banganapalli',
        season: 'Summer',
        yield: 8000,
        price: 55.0,
        min_p: 45.0,
        max_p: 70.0,
        trend: 'decreasing',
        f_min: 48.0,
        f_max: 60.0,
        img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=600&auto=format&fit=crop&q=80'
    },
    {
        id: 'crop_turmeric',
        name: 'Turmeric',
        category: 'Spices',
        variety: 'Duggirala Selam',
        season: 'Rabi',
        yield: 6000,
        price: 135.0,
        min_p: 120.0,
        max_p: 155.0,
        trend: 'stable',
        f_min: 130.0,
        f_max: 145.0,
        img: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80'
    },
    {
        id: 'crop_cotton',
        name: 'Cotton',
        category: 'Commercial Crops',
        variety: 'Bt-Cotton Long Staple',
        season: 'Kharif',
        yield: 1200,
        price: 74.0,
        min_p: 68.0,
        max_p: 82.0,
        trend: 'increasing',
        f_min: 72.0,
        f_max: 78.0,
        img: 'https://images.unsplash.com/photo-1594897030560-692723cf23b2?w=600&auto=format&fit=crop&q=80'
    },
    {
        id: 'crop_maize',
        name: 'Maize (Corn)',
        category: 'Cereals & Grains',
        variety: 'Yellow Dent Hybrid',
        season: 'Rabi',
        yield: 3200,
        price: 22.0,
        min_p: 19.5,
        max_p: 25.0,
        trend: 'increasing',
        f_min: 21.0,
        f_max: 24.5,
        img: 'https://images.unsplash.com/photo-1551754655-cd27e38d2076?w=600&auto=format&fit=crop&q=80'
    }
];

async function ensureReferenceData() {
    const existing = await query('SELECT id FROM crops');

    const existingIds = new Set(existing.map(row => row.id));

    for (const c of crops) {
        if (existingIds.has(c.id)) continue;

        await run(
            `INSERT INTO crops (
        id,
        name,
        category,
        variety,
        season,
        expected_yield_kg_per_acre,
        current_market_price,
        min_price,
        max_price,
        price_trend,
        indicative_forecast_min,
        indicative_forecast_max,
        image_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                c.id,
                c.name,
                c.category,
                c.variety,
                c.season,
                c.yield,
                c.price,
                c.min_p,
                c.max_p,
                c.trend,
                c.f_min,
                c.f_max,
                c.img
            ]
        );
    }

    console.log('Reference crop data verified.');
}

module.exports = {
    ensureReferenceData
};