// server.js — Application de réservation pour Hôtel Louvain

const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Room = require('./models/Room');
const Reservation = require('./models/Reservation');
require('./db');

const app = express();
const PORT = 3000;

/* =========================
   CONFIGURATION
========================= */

// moteur de vues
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// fichiers statiques + formulaires
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));

// sessions
app.use(
  session({
    secret: 'hotel-louvain-secret',
    resave: false,
    saveUninitialized: false
  })
);

// utilisateur dispo dans toutes les vues
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

/* =========================
   MIDDLEWARES
========================= */

function ensureAuthenticated(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
}

// calcul du nombre de nuits
function nightsBetween(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);

  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  const diff = end.getTime() - start.getTime();
  const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));

  return Math.max(1, nights);
}

/* =========================
   ROUTES PUBLIQUES
========================= */

// accueil
app.get('/', async (req, res) => {
  try {
    const rooms = await Room.find({ isActive: true }).limit(3);
    res.render('index', { rooms });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// liste des chambres + filtre + recherche
app.get('/rooms', async (req, res) => {
  const type = req.query.type || 'all';
  const q = req.query.q || '';

  const filter = { isActive: true };

  if (type !== 'all') {
    filter.type = type;
  }

  if (q.trim() !== '') {
    filter.name = { $regex: q, $options: 'i' };
  }

  try {
    const rooms = await Room.find(filter);
    res.render('rooms', { rooms, type, q });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// détail chambre
app.get('/rooms/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room || !room.isActive) {
      return res.status(404).send('Chambre introuvable');
    }
    res.render('room_detail', { room, error: null });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

/* =========================
   RÉSERVATIONS
========================= */

// créer réservation + prévention des conflits
app.post('/rooms/:id/reserve', ensureAuthenticated, async (req, res) => {
  const { checkIn, checkOut, guests } = req.body;

  if (!checkIn || !checkOut || !guests) {
    return res.redirect(`/rooms/${req.params.id}`);
  }

  try {
    const room = await Room.findById(req.params.id);
    if (!room || !room.isActive) {
      return res.status(404).send('Chambre introuvable');
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return res.render('room_detail', {
        room,
        error: "La date de départ doit être après la date d'arrivée."
      });
    }

    // 🔒 prévention des conflits (overlap)
    const conflict = await Reservation.findOne({
      roomId: room._id,
      status: 'confirmed',
      checkIn: { $lt: checkOutDate },
      checkOut: { $gt: checkInDate }
    });

    if (conflict) {
      return res.render('room_detail', {
        room,
        error: "Cette chambre est déjà réservée pour ces dates."
      });
    }

    const reservation = new Reservation({
      userId: req.session.user._id,
      roomId: room._id,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: Number(guests),
      status: 'confirmed'
    });

    await reservation.save();

    const nights = nightsBetween(checkInDate, checkOutDate);
    const totalPrice = nights * room.pricePerNight;

    res.render('reservation_confirmed', {
      room,
      reservation,
      nights,
      totalPrice
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// mes réservations + total
app.get('/my-reservations', ensureAuthenticated, async (req, res) => {
  try {
    const raw = await Reservation.find({ userId: req.session.user._id })
      .populate('roomId')
      .sort({ checkIn: -1 });

    const reservations = raw.map(r => {
      const nights = nightsBetween(r.checkIn, r.checkOut);
      const totalPrice = r.roomId
        ? nights * r.roomId.pricePerNight
        : 0;

      return {
        ...r.toObject(),
        nights,
        totalPrice
      };
    });

    res.render('my_reservations', { reservations });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

/* =========================
   ANNULATION (> 48h)
========================= */

// page annulation
app.get('/reservations/:id/cancel', ensureAuthenticated, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).populate('roomId');

    if (!reservation) {
      return res.status(404).send('Réservation introuvable');
    }

    if (String(reservation.userId) !== String(req.session.user._id)) {
      return res.status(403).send('Accès interdit');
    }

    const canCancel =
      reservation.status === 'confirmed' &&
      (new Date(reservation.checkIn).getTime() - Date.now()) >=
        48 * 60 * 60 * 1000;

    res.render('cancel_reservation', {
      reservation,
      canCancel,
      error: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

// action annuler
app.post('/reservations/:id/cancel', ensureAuthenticated, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).send('Réservation introuvable');
    }

    if (String(reservation.userId) !== String(req.session.user._id)) {
      return res.status(403).send('Accès interdit');
    }

    const canCancel =
      reservation.status === 'confirmed' &&
      (new Date(reservation.checkIn).getTime() - Date.now()) >=
        48 * 60 * 60 * 1000;

    if (!canCancel) {
      return res.redirect(`/reservations/${reservation._id}/cancel`);
    }

    reservation.status = 'cancelled';
    await reservation.save();

    res.redirect('/my-reservations');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

/* =========================
   AUTHENTIFICATION
========================= */

app.get('/register', (req, res) => {
  res.render('register', { error: null });
});

app.post('/register', async (req, res) => {
  const { email, username, password, confirmPassword } = req.body;

  if (!email || !username || !password || !confirmPassword) {
    return res.render('register', { error: 'Veuillez remplir tous les champs.' });
  }

  if (password !== confirmPassword) {
    return res.render('register', { error: 'Les mots de passe ne correspondent pas.' });
  }

  try {
    const exists = await User.findOne({ email });
    if (exists) {
      return res.render('register', { error: 'Email déjà utilisé.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, username, passwordHash });

    req.session.user = {
      _id: user._id.toString(),
      email: user.email,
      username: user.username
    };

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.render('login', { error: 'Veuillez remplir tous les champs.' });
  }

  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.render('login', { error: 'Email ou mot de passe incorrect.' });
    }

    req.session.user = {
      _id: user._id.toString(),
      email: user.email,
      username: user.username
    };

    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.status(500).send('Erreur serveur');
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

/* =========================
   DÉMARRAGE
========================= */

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Serveur démarré sur http://localhost:${PORT}`);
  });
}

module.exports = app;
