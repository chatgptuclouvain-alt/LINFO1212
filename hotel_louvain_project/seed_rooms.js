const Room = require("./models/Room");
require("./db");

async function run() {
  try {
    await Room.deleteMany({});

    await Room.insertMany([
      {
        name: "Chambre 101",
        type: "single",
        pricePerNight: 70,
        capacity: 1,
        description: "Petite chambre confortable.",
        amenities: ["WiFi", "TV"],
        imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        isActive: true
      },
      {
        name: "Chambre 102",
        type: "single",
        pricePerNight: 75,
        capacity: 1,
        description: "Chambre single calme, idéale pour travailler.",
        amenities: ["WiFi", "Bureau"],
        imageUrl: "https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80",
        isActive: true
      },
      {
        name: "Chambre 103",
        type: "single",
        pricePerNight: 80,
        capacity: 1,
        description: "Single moderne avec bonne luminosité.",
        amenities: ["WiFi", "TV", "Bureau"],
        imageUrl: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=80",
        isActive: true
      },
      {
        name: "Chambre 104",
        type: "single",
        pricePerNight: 85,
        capacity: 1,
        description: "Single cosy, parfaite pour un court séjour.",
        amenities: ["WiFi", "TV"],
        imageUrl: "https://images.unsplash.com/photo-1505691723518-36a5ac3b2d65?auto=format&fit=crop&w=1200&q=80",
        isActive: true
      },
      {
        name: "Chambre 201",
        type: "double",
        pricePerNight: 110,
        capacity: 2,
        description: "Chambre double classique, excellent rapport qualité/prix.",
        amenities: ["WiFi", "TV"],
        imageUrl: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80",
        isActive: true
      },
      {
        name: "Chambre 202",
        type: "double",
        pricePerNight: 120,
        capacity: 2,
        description: "Chambre double lumineuse.",
        amenities: ["WiFi", "Mini-bar"],
        imageUrl: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
        isActive: true
      },
      {
        name: "Chambre 203",
        type: "double",
        pricePerNight: 130,
        capacity: 2,
        description: "Double supérieure avec plus d’espace.",
        amenities: ["WiFi", "TV", "Mini-bar"],
        imageUrl: "https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=1200&q=80",
        isActive: true
      },
      {
        name: "Chambre 204",
        type: "double",
        pricePerNight: 140,
        capacity: 2,
        description: "Double premium, ambiance élégante.",
        amenities: ["WiFi", "TV", "Coffre-fort"],
        imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
        isActive: true
      },
      {
        name: "Suite Junior",
        type: "suite",
        pricePerNight: 190,
        capacity: 3,
        description: "Suite junior avec coin salon.",
        amenities: ["WiFi", "Salon", "TV"],
        imageUrl: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?auto=format&fit=crop&w=1200&q=80",
        isActive: true
      },
      {
        name: "Suite Royale",
        type: "suite",
        pricePerNight: 250,
        capacity: 4,
        description: "Suite luxueuse avec salon.",
        amenities: ["WiFi", "Jacuzzi", "Salon"],
        imageUrl: "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80",
        isActive: true
      },
      {
        name: "Suite Familiale",
        type: "suite",
        pricePerNight: 280,
        capacity: 5,
        description: "Suite familiale idéale pour un séjour en groupe.",
        amenities: ["WiFi", "Salon", "Canapé-lit", "TV"],
        imageUrl: "https://images.unsplash.com/photo-1505691723518-36a5ac3b2d65?auto=format&fit=crop&w=1200&q=80",
        isActive: true
      },
      {
        name: "Suite Panoramique",
        type: "suite",
        pricePerNight: 320,
        capacity: 4,
        description: "Suite haut de gamme avec vue panoramique.",
        amenities: ["WiFi", "Salon", "Baignoire", "TV"],
        imageUrl: "https://images.unsplash.com/photo-1501117716987-c8e1ecb210b0?auto=format&fit=crop&w=1200&q=80",
        isActive: true
      }
    ]);

    console.log("Chambres insérées !");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

run();
