          // proiectul 04 · animaticul cadrelor din lift
(function () {
  "use strict";
  /* ---------- date ---------- */
  // Plan: liftul ocupă x 0..100, y 0..100 (y=0 peretele din spate, y=100 peretele cu ușa). Palierul e sub, y 100..150.
  // Ușa: x 30..70 pe y=100, un singur panou care, privit când intri, se închide de la stânga la dreapta (vine din partea butoanelor).
  var POS = [
    { n: 1, name: "Fundul liftului", time: "16:00–17:30" },
    { n: 2, name: "Colțul din față", time: "17:30–18:45" },
    { n: 3, name: "Bilețelele", time: "18:45–19:15" },
    { n: 4, name: "Palierul et. 3", time: "19:15–20:30" },
    { n: 5, name: "Detalii și sunet", time: "20:30–21:15" }
  ];
  var CAM_BACK = { x: 50, y: 4, tx: 50, ty: 100 };
  var CAM_CORNER = { x: 12, y: 88, tx: 72, ty: 30 };
  var CAM_MIRROR = { x: 34, y: 66, tx: 14, ty: 100 };
  function K(t, o) { o.t = t; return o; }

  var S = [
    // ---- Poziția 1
    { p: 1, clap: "SC 1 · 1A", fit: "1", who: "El", lens: 18, fps: 24, cam: CAM_BACK, view: "wide",
      title: "El intră singur cu cutia FRAGIL",
      desc: "Cadrul de deschidere al inelului. Camera stă fix, pe centru, la nivelul pieptului. Ușa se deschide, El intră cu cutia și se întoarce cu fața spre ușă.",
      tips: ["Simetrie perfectă: ușa fix în mijlocul cadrului.", "Pornește înregistrarea cu 3 secunde înainte să se deschidă ușa.", "Marchează trepiedul cu bandă: de aici filmezi încă 7 pași."],
      k: [K(0, { door: 0, el: [52, 128], box: "el", disp: "P" }), K(.22, { door: 1 }), K(.32, { el: [52, 112] }), K(.7, { el: [54, 62] }), K(.82, { door: 1 }), K(1, { door: 0, el: [54, 62] })] },
    { p: 1, clap: "SC 2 · 2B", fit: "1", who: "El + Ea", lens: 18, fps: 24, cam: CAM_BACK, view: "wide",
      title: "Ușa se închide în fața Ei, El o redeschide",
      desc: "Gestul fluture, văzut din spate. Panoul ușii se închide și o taie pe Ea afară. El stă lângă butoane și apasă cu cotul, panoul se retrage, Ea intră repede și dă din cap.",
      tips: ["Ea pornește spre lift exact când panoul începe să se închidă.", "Pe ecran trebuie să se vadă dezamăgirea Ei prin spațiul rămas.", "Repetă dubla până panoul se oprește la aproximativ o treime."],
      k: [K(0, { door: 1, el: [24, 76], box: "el", ea: [60, 142] }), K(.25, { door: .7, ea: [60, 122] }), K(.42, { door: .3, ea: [62, 108] }), K(.52, { door: .3 }), K(.66, { door: 1 }), K(.86, { ea: [58, 58] }), K(1, { door: 0, ea: [58, 58] })] },
    { p: 1, clap: "SC 5 · 5B · ziua 1", fit: "1", who: "El + Ea", lens: 18, fps: 24, cam: CAM_BACK, view: "wide",
      title: "Ziua 1: distanță maximă",
      desc: "Același cadru fix, trei zile la rând. Azi stau lipiți de pereți opuși, fiecare cu privirea la afișaj.",
      tips: ["Nu muta trepiedul între zilele 1, 2 și 3.", "Doar haina de deasupra se schimbă, restul rămâne.", "Lasă-i să stea 6–8 secunde: tăcerea e scena."],
      k: [K(0, { door: 0, el: [86, 52], ea: [14, 52], disp: "1" }), K(.5, { el: [86, 51], ea: [14, 53], disp: "2" }), K(1, { el: [86, 52], ea: [14, 52], disp: "3" })] },
    { p: 1, clap: "SC 5 · 5B · ziua 2", fit: "2", who: "El + Ea", lens: 18, fps: 24, cam: CAM_BACK, view: "wide",
      title: "Ziua 2: distanță medie",
      desc: "Aceeași poziție a camerei. Se apropie cu un pas fiecare și își aruncă o privire scurtă.",
      tips: ["Verifică poza de referință: cadrul trebuie să fie identic.", "O singură privire unul spre altul, apoi înapoi la afișaj."],
      k: [K(0, { door: 0, el: [70, 52], ea: [30, 52], disp: "1" }), K(.5, { el: [69, 52], ea: [31, 52] }), K(1, { el: [70, 52], ea: [30, 52], disp: "3" })] },
    { p: 1, clap: "SC 5 · 5B · ziua 3", fit: "3", who: "El + Ea", lens: 18, fps: 24, cam: CAM_BACK, view: "wide",
      title: "Ziua 3: umăr la umăr",
      desc: "Stau lângă umăr unul de altul, în mijlocul liftului. Pusă una după alta în montaj, cele trei zile arată cum distanța dispare.",
      tips: ["Umerii aproape, dar nu lipiți: lasă loc pentru scena următoare."],
      k: [K(0, { door: 0, el: [56, 52], ea: [44, 52], disp: "1" }), K(1, { el: [55, 52], ea: [45, 52], disp: "3" })] },
    { p: 1, clap: "SC 5 · 5C", fit: "3", who: "El + Ea", lens: 23, fps: 24, cam: CAM_BACK, view: "wide",
      title: "Ea adoarme pe umărul lui",
      desc: "Treci pe 23 mm fără să muți trepiedul. Ea își lasă capul pe umărul lui, El nu se mișcă să n-o trezească.",
      tips: ["Mișcare foarte lentă: capul coboară în 3–4 secunde.", "El poate zâmbi abia la final, fără să se uite la Ea."],
      k: [K(0, { door: 0, el: [55, 52], ea: [45, 52], lean: 0 }), K(.6, { ea: [48, 52], lean: 1 }), K(1, { ea: [48, 52], lean: 1 })] },
    { p: 1, clap: "SC 11 · 1A", fit: "4", who: "El + Ea", lens: 18, fps: 24, cam: CAM_BACK, view: "wide",
      title: "Finalul: amândoi cu cutia FRAGIL",
      desc: "Închiderea inelului: exact cadrul de la pasul 1, dar acum intră amândoi și duc cutia împreună. Ușa se închide și acoperă cadrul.",
      tips: ["Același loc al trepiedului ca la pasul 1, verifică poza de referință.", "Ține cadrul până panoul acoperă complet ușa."],
      k: [K(0, { door: 0, el: [56, 130], ea: [44, 130], box: "both", disp: "2" }), K(.2, { door: 1 }), K(.62, { el: [56, 62], ea: [44, 62] }), K(.75, { door: 1 }), K(1, { door: 0 })] },
    { p: 1, clap: "SC 6 · 6C", fit: "fără actori", who: "Liftul gol", lens: 18, fps: 24, cam: CAM_BACK, view: "wide",
      title: "Liftul gol, ușa se închide",
      desc: "Pentru pista falsă. Nimeni în lift, ușa se închide încet. Actorii pot ieși din cadru și își schimbă haina pentru poziția 2.",
      tips: ["Lasă 3 secunde de lift gol înainte să se închidă ușa."],
      k: [K(0, { door: 1 }), K(.35, { door: 1 }), K(1, { door: 0 })] },

    // ---- Poziția 2
    { p: 2, clap: "SC 2 · 2A", fit: "1", who: "El", lens: 35, fps: 60, cam: { x: 34, y: 84, tx: 18, ty: 100 }, view: "button", elbow: true,
      title: "Cotul apasă butonul de deschidere",
      desc: "Detaliu din colțul din față. Mâinile Lui sunt ocupate de cutie, așa că apasă cu cotul. Filmează la 60 fps pentru slow-motion.",
      tips: ["Setează shutter 1/125 pentru 60 fps.", "Focus manual fix pe butonul de deschidere."],
      k: [K(0, { press: 0 }), K(.45, { press: 0 }), K(.6, { press: 1 }), K(.8, { press: 1 }), K(1, { press: 0 })] },
    { p: 2, clap: "SC 2 · 2C", fit: "1", who: "Ea", lens: 35, fps: 24, cam: { x: 34, y: 84, tx: 18, ty: 100 }, view: "button", elbow: false,
      title: "Degetul Ei apasă 3",
      desc: "Același unghi ca pasul anterior. Un deget intră în cadru și apasă etajul 3.",
      tips: ["Butonul 3 trebuie să se aprindă în cadru."],
      k: [K(0, { press: 0 }), K(.45, { press: 0 }), K(.6, { press: 1 }), K(1, { press: 1 })] },
    { p: 2, clap: "SC 2 · 2D", fit: "1", who: "El", lens: 35, fps: 24, cam: CAM_CORNER, view: "face", face: "el",
      title: "Prim-plan El: privire în jos, zâmbet scurt",
      desc: "Camera în colțul de lângă butoane, la înălțimea ochilor Lui. Unghi de trei sferturi: El se uită puțin pe lângă cameră, niciodată în ea.",
      tips: ["Focus pe ochiul cel mai apropiat de cameră.", "Lasă spațiu liber în partea în care se uită.", "Lumina caldă din partea opusă camerei."],
      k: [K(0, { smile: 0, look: -1 }), K(.5, { smile: 0, look: -1 }), K(.75, { smile: .7, look: -.4 }), K(1, { smile: .2, look: -1 })] },
    { p: 2, clap: "SC 2 · 2E", fit: "1", who: "Ea", lens: 35, fps: 24, cam: CAM_CORNER, view: "face", face: "ea",
      title: "Prim-plan Ea: privire spre afișaj",
      desc: "Rotești doar capul trepiedului spre Ea. Se uită în sus, la afișaj, evitând privirea Lui.",
      tips: ["Camera la înălțimea ochilor Ei, nu de sus.", "Privirea urcă încet spre afișaj."],
      k: [K(0, { smile: 0, look: 0, up: 0 }), K(.6, { up: 1 }), K(1, { up: 1, look: .3 })] },
    { p: 2, clap: "SC 4 · 4B", fit: "2", who: "El", lens: 35, fps: 24, cam: CAM_CORNER, view: "face", face: "el",
      title: "El citește un bilețel și zâmbește",
      desc: "Ținuta 2. Același unghi ca la 2D. El citește bilețelul de lângă butoane, iar zâmbetul apare încet.",
      tips: ["Dă-i un gând, nu o comandă: „îți amintești cum ai apăsat cu cotul”.", "Filmează 3 variante: zâmbet mic, mediu, mare."],
      k: [K(0, { smile: 0, look: -.8 }), K(.45, { smile: .1 }), K(1, { smile: 1, look: -.8 })] },
    { p: 2, clap: "SC 4 · 4C", fit: "2", who: "Ea", lens: 35, fps: 24, cam: CAM_CORNER, view: "face", face: "ea",
      title: "Ea citește un bilețel și râde",
      desc: "Ținuta 2. Ea citește „Scuze. Am și cântat?” și râde scurt.",
      tips: ["Râsul vine natural dacă textul e nou pentru Ea: arată-i bilețelul abia la dublă."],
      k: [K(0, { smile: 0, look: .6 }), K(.4, { smile: .3 }), K(.65, { smile: 1, laugh: 1 }), K(1, { smile: .8, laugh: 0 })] },
    { p: 2, clap: "SC 4 · 4D", fit: "Ea: 2", who: "Ea (mâna)", lens: 35, fps: 24, cam: CAM_MIRROR, view: "mirror", hand: true,
      title: "Mâna Ei lipește un post-it roz",
      desc: "Muți trepiedul la 45° față de peretele de metal de lângă butoane, cum vei sta și la poziția 3. Se vede doar mâna care lipește bilețelul.",
      tips: ["Metalul lucios reflectă: verifică să nu se vadă camera în el.", "Post-it-ul roz intră în cadru din dreapta."],
      k: [K(0, { notes: 4, hand: 0 }), K(.5, { hand: 1 }), K(.65, { notes: 5, hand: 1 }), K(1, { notes: 5, hand: 0 })] },
    { p: 2, clap: "SC 6 · 6B", fit: "Ea: 4", who: "Ea", lens: 35, fps: 24, cam: CAM_CORNER, view: "face", face: "ea",
      title: "Fața Ei se întunecă la „Mă mut.”",
      desc: "Ținuta 4, înapoi în colțul din față. Ea citește bilețelul „Mă mut.” și zâmbetul dispare.",
      tips: ["Fără lacrimi: doar zâmbetul care se stinge și privirea în jos.", "Ține cadrul 2 secunde după reacție."],
      k: [K(0, { smile: .7, look: .6 }), K(.45, { smile: .7 }), K(.8, { smile: -.6, look: .2, down: 1 }), K(1, { smile: -.6, down: 1 })] },

    // ---- Poziția 3
    { p: 3, clap: "SC 3 · 3A", fit: "fără actori", who: "Bilețelele", lens: 35, fps: 24, cam: CAM_MIRROR, view: "mirror",
      title: "Bilețelul 1, lângă butoane",
      desc: "Pauza actorilor. Trepied la 45° față de peretele de metal cu butoanele, același unghi pentru toate bilețelele.",
      tips: ["„Mersi pentru ușă. – 3”, scris de Ea, post-it roz."],
      k: [K(0, { notes: 0 }), K(.4, { notes: 1 }), K(1, { notes: 1 })] },
    { p: 3, clap: "SC 3 · 3B", fit: "fără actori", who: "Bilețelele", lens: 35, fps: 24, cam: CAM_MIRROR, view: "mirror",
      title: "Se adaugă răspunsul Lui",
      desc: "„Oricând. – 2”, post-it galben, dedesubt.",
      tips: ["Nu mișca trepiedul între bilețele."],
      k: [K(0, { notes: 1 }), K(.4, { notes: 2 }), K(1, { notes: 2 })] },
    { p: 3, clap: "SC 4 · 4A · #3", fit: "fără actori", who: "Bilețelele", lens: 35, fps: 24, cam: CAM_MIRROR, view: "mirror",
      title: "„Ai mutat dulapul la 2 noaptea?”",
      desc: "Al treilea bilețel, de la Ea.", tips: ["Fiecare bilețel e un cadru separat, 3–4 secunde."],
      k: [K(0, { notes: 2 }), K(.4, { notes: 3 }), K(1, { notes: 3 })] },
    { p: 3, clap: "SC 4 · 4A · #4", fit: "fără actori", who: "Bilețelele", lens: 35, fps: 24, cam: CAM_MIRROR, view: "mirror",
      title: "„Scuze. Am și cântat?”", desc: "Al patrulea, de la El.", tips: ["Scris mare, lizibil de la distanță."],
      k: [K(0, { notes: 3 }), K(.4, { notes: 4 }), K(1, { notes: 4 })] },
    { p: 3, clap: "SC 4 · 4A · #5", fit: "fără actori", who: "Bilețelele", lens: 35, fps: 24, cam: CAM_MIRROR, view: "mirror",
      title: "„Da. Fals.”", desc: "Al cincilea, de la Ea.", tips: ["Același unghi, aceeași lumină."],
      k: [K(0, { notes: 4 }), K(.4, { notes: 5 }), K(1, { notes: 5 })] },
    { p: 3, clap: "SC 4 · 4A · #6", fit: "fără actori", who: "Bilețelele", lens: 35, fps: 24, cam: CAM_MIRROR, view: "mirror",
      title: "„Pizza în plus. Vrei?”", desc: "Al șaselea, de la El, cu un număr fictiv.", tips: ["Numărul de pe bilețel să fie inventat."],
      k: [K(0, { notes: 5 }), K(.4, { notes: 6 }), K(1, { notes: 6 })] },
    { p: 3, clap: "SC 6 · 6A", fit: "fără actori", who: "Bilețelele", lens: 35, fps: 24, cam: CAM_MIRROR, view: "mirror", alone: true,
      title: "Rămâne doar „Mă mut.”", desc: "Scoți toate bilețelele. Pe metal rămâne un singur post-it galben.", tips: ["Pista falsă: cadrul ține 3 secunde, fără nimic altceva."],
      k: [K(0, { notes: 6 }), K(.35, { notes: 0 }), K(.6, { notes: -1 }), K(1, { notes: -1 })] },

    // ---- Poziția 4
    { p: 4, clap: "SC 7 · 7A", fit: "4", who: "Camera", lens: 18, fps: 24, cam: { x: 50, y: 70, tx: 86, ty: 146 }, camTo: { x: 62, y: 124, tx: 86, ty: 146 }, view: "landing",
      title: "Ușa se deschide la 3, camera iese spre cutii",
      desc: "Din mână, cu stabilizarea pornită. Panoul liftului se retrage, iar camera iese încet pe palier, spre cutiile de la ușa Ei.",
      tips: ["Pași mici, genunchii ușor îndoiți.", "Cutiile sunt deja aranjate înainte de dublă."],
      k: [K(0, { door: 0, push: 0 }), K(.3, { door: 1 }), K(1, { door: 1, push: 1 })] },
    { p: 4, clap: "SC 7 · 7B", fit: "4", who: "Cutia", lens: 35, fps: 24, cam: { x: 70, y: 126, tx: 84, ty: 140 }, view: "boxnote",
      title: "Bilețelul de pe cutia FRAGIL",
      desc: "Trepied, 35 mm. Insert pe bilețelul „Mă mut. La tine. (Dacă vrei.)”.",
      tips: ["Lasă cadrul gol o secundă, apoi treci prin focus pe bilețel."],
      k: [K(0, { focus: 0 }), K(.5, { focus: 1 }), K(1, { focus: 1 })] },
    { p: 4, clap: "SC 8 · 8A", fit: "4", who: "Ea", lens: 35, fps: 60, cam: { x: 66, y: 118, tx: 88, ty: 140 }, view: "face", face: "ea", landing: true,
      title: "Ea își acoperă gura și râde",
      desc: "Pe palier, camera la înălțimea ochilor Ei, trei sferturi. 60 fps pentru un slow-motion ușor.",
      tips: ["Mâna urcă la gură, apoi râsul.", "Shutter 1/125."],
      k: [K(0, { smile: 0, look: .4, handUp: 0 }), K(.45, { handUp: 1, smile: .5 }), K(.8, { handUp: 1, smile: 1, laugh: 1 }), K(1, { handUp: .4, smile: 1 })] },
    { p: 4, clap: "SC 8 · 8B", fit: "4", who: "El", lens: 23, fps: 24, cam: { x: 46, y: 116, tx: 22, ty: 138 }, view: "stairs",
      title: "El stă pe o cutie, ridică din umeri",
      desc: "Din mână, apropiere lentă spre El, care stă așezat pe o cutie lângă perete, cu cutia FRAGIL în brațe.",
      tips: ["Apropierea durează toată dubla, 4–5 secunde.", "Ridicatul din umeri vine la final."],
      k: [K(0, { push: 0, shrug: 0, el: [22, 140], box: "el" }), K(.75, { push: .8, shrug: 0 }), K(.88, { shrug: 1 }), K(1, { push: 1, shrug: 0 })] },
    { p: 4, clap: "SC 9 · 9A", fit: "4", who: "Ea (mâna)", lens: 55, fps: 24, cam: { x: 74, y: 128, tx: 84, ty: 140 }, view: "boxhand",
      title: "Mâna Ei pe cutia FRAGIL",
      desc: "Trepied, 55 mm, cât mai aproape. Liniștea dinaintea logo-ului: mâna se așază pe scrisul de mână.",
      tips: ["La 55 mm diafragma maximă e f/4: mai multă lumină."],
      k: [K(0, { hand: 0 }), K(.6, { hand: 1 }), K(1, { hand: 1 })] },
    { p: 4, clap: "SC 1 · 1C", fit: "fără actori", who: "Cutia", lens: 35, fps: 60, cam: { x: 74, y: 128, tx: 84, ty: 140 }, view: "boxtext",
      title: "Scrisul FRAGIL de pe cutie",
      desc: "Detaliu în treacăt, la 60 fps: camera alunecă de-a lungul scrisului.",
      tips: ["Fără logo pe cutie: firma apare doar la drop."],
      k: [K(0, { slide: 0 }), K(1, { slide: 1 })] },
    { p: 4, clap: "SC 10 · 10A", fit: "4", who: "Mâini", lens: 35, fps: 60, cam: { x: 70, y: 130, tx: 84, ty: 142 }, view: "tape",
      title: "Bandă trasă, cutii închise",
      desc: "B-roll pentru drop, din mână, la 60 fps. Fă mai multe variante scurte, tăieturile vin pe beat.",
      tips: ["Fiecare gest durează 1–2 secunde.", "Înregistrează și sunetul benzii."],
      k: [K(0, { tape: 0 }), K(.7, { tape: 1 }), K(1, { tape: 1 })] },

    // ---- Poziția 5
    { p: 5, clap: "SC 1 · 1B", fit: "fără actori", who: "Afișajul", lens: 35, fps: 24, cam: { x: 50, y: 70, tx: 50, ty: 100 }, view: "display",
      title: "Afișajul arată P", desc: "Liftul pornește de la parter. Insert pe afișajul de deasupra ușii.", tips: ["Cifrele digitale pâlpâie: încearcă shutter 1/50."],
      k: [K(0, { floor: "P" }), K(1, { floor: "P" })] },
    { p: 5, clap: "SC 11 · 11A", fit: "fără actori", who: "Afișajul", lens: 35, fps: 24, cam: { x: 50, y: 70, tx: 50, ty: 100 }, view: "display",
      title: "Afișajul trece de la 2 la 3", desc: "Urci cu liftul de la 2 la 3 și filmezi cifrele cum se schimbă.", tips: ["Pornește înregistrarea încă de la 2."],
      k: [K(0, { floor: "2" }), K(.55, { floor: "2" }), K(.56, { floor: "3" }), K(1, { floor: "3" })] },
    { p: 5, clap: "SC 5 · 5A", fit: "fără actori", who: "Telefonul", lens: 35, fps: 24, cam: { x: 50, y: 50, tx: 50, ty: 80 }, view: "phone",
      title: "„Coborâm împreună?”", desc: "Ecranul telefonului, cu luminozitatea la maximum și fontul mărit.", tips: ["Dezactivează notificările înainte."],
      k: [K(0, { msg: 0 }), K(.5, { msg: 1 }), K(1, { msg: 1 })] },
    { p: 5, clap: "SUNET", fit: "fără actori", who: "Microfonul", lens: 0, fps: 0, cam: null, mic: { x: 50, y: 50 }, view: "sound",
      title: "Sunetele liftului", desc: "30 de secunde de liniște în lift, apoi clinchetul, ușa, butoanele și banda trasă, fiecare separat.", tips: ["Telefonul aproape de sursă, în modul avion."],
      k: [K(0, { wave: 0 }), K(1, { wave: 1 })] }
  ];

  /* ---------- interpolare ---------- */
  S.forEach(function (s) {
    var cur = { door: 0, el: null, ea: null, box: null, disp: "P" };
    s.full = s.k.map(function (f) {
      var o = {};
      for (var k in cur) o[k] = cur[k];
      for (var k2 in f) o[k2] = f[k2];
      cur = o;
      return o;
    });
  });
  function lerp(a, b, u) { return a + (b - a) * u; }
  function ease(u) { return u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2; }
  function stateAt(s, t) {
    var f = s.full, i = 0;
    while (i < f.length - 1 && f[i + 1].t <= t) i++;
    var a = f[i], b = f[Math.min(i + 1, f.length - 1)];
    var u = b.t > a.t ? ease((t - a.t) / (b.t - a.t)) : 0;
    var o = {};
    for (var k in a) {
      var va = a[k], vb = b[k];
      if (typeof va === "number" && typeof vb === "number") o[k] = lerp(va, vb, u);
      else if (Array.isArray(va) && Array.isArray(vb)) o[k] = [lerp(va[0], vb[0], u), lerp(va[1], vb[1], u)];
      else o[k] = u > .5 && vb !== undefined ? vb : va;
    }
    for (var k3 in b) if (!(k3 in o)) o[k3] = b[k3];
    if (s.camTo) o.cam = { x: lerp(s.cam.x, s.camTo.x, ease(t)), y: lerp(s.cam.y, s.camTo.y, ease(t)), tx: s.cam.tx, ty: s.cam.ty };
    else o.cam = s.cam;
    return o;
  }

  /* ---------- desen: plan ---------- */
  var C = { ink: "#141414", paper: "#ede6da", card: "#fffdf8", mute: "#5a5246", y: "#ffe45c", p: "#ff9ec4", o: "#ff5a1f", steel: "#d9dee2", steel2: "#b9c1c8", wood: "#c49a6c", line: "#c9bfae" };
  function fovOf(lens) { return lens ? 2 * Math.atan(23.5 / (2 * lens)) : 0; }
  function person(x, y, col, letter, r) {
    r = r || 6.5;
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + col + '" stroke="' + C.ink + '" stroke-width="1.4"/>' +
      '<text x="' + x + '" y="' + (y + 2.6) + '" font-family="JetBrains Mono, monospace" font-size="7" font-weight="700" text-anchor="middle" fill="' + C.ink + '">' + letter + '</text>';
  }
  function drawPlan(s, st) {
    var g = [];
    // palier
    g.push('<rect x="-12" y="100" width="124" height="52" fill="#e3dccf" stroke="none"/>');
    g.push('<text x="-10" y="150" font-family="JetBrains Mono, monospace" font-size="4.4" fill="' + C.mute + '">PALIER</text>');
    // ușa apartamentului Ei
    g.push('<rect x="78" y="148" width="18" height="3" fill="' + C.wood + '" stroke="' + C.ink + '" stroke-width=".8"/>');
    g.push('<text x="87" y="145" font-family="JetBrains Mono, monospace" font-size="4" text-anchor="middle" fill="' + C.mute + '">ușa Ei</text>');
    // cutiile de pe palier (poziția 4)
    if (s.p === 4) {
      [[80, 136], [88, 136], [84, 128]].forEach(function (b) { g.push('<rect x="' + (b[0] - 3.5) + '" y="' + (b[1] - 3.5) + '" width="7" height="7" fill="' + C.wood + '" stroke="' + C.ink + '" stroke-width=".9"/>'); });
    }
    // liftul
    g.push('<rect x="0" y="0" width="100" height="100" fill="' + C.card + '" stroke="none"/>');
    // pereți de sticlă (spate, stânga, dreapta) și peretele de metal cu ușa
    g.push('<path d="M0 100 V0 H100 V100" fill="none" stroke="#7ea4bd" stroke-width="3"/>');
    g.push('<path d="M30 100 H0 M100 100 H70" fill="none" stroke="' + C.ink + '" stroke-width="2.8"/>');
    g.push('<text x="50" y="-4" font-family="JetBrains Mono, monospace" font-size="4.4" text-anchor="middle" fill="#4d6f86">sticlă · vedere afară</text>');
    g.push('<text x="-5" y="50" font-family="JetBrains Mono, monospace" font-size="4" fill="#4d6f86" transform="rotate(-90 -5 50)" text-anchor="middle">sticlă</text>');
    g.push('<text x="105" y="50" font-family="JetBrains Mono, monospace" font-size="4" fill="#4d6f86" transform="rotate(90 105 50)" text-anchor="middle">sticlă</text>');
    // butoane și bilețele, pe metal, în stânga când intri
    g.push('<rect x="14" y="95" width="9" height="3.4" fill="' + C.steel2 + '" stroke="' + C.ink + '" stroke-width=".7"/>');
    g.push('<rect x="3" y="96" width="9" height="2.6" fill="' + C.p + '"/><rect x="24.5" y="96" width="4" height="2.6" fill="' + C.y + '"/>');
    g.push('<text x="16" y="91.5" font-family="JetBrains Mono, monospace" font-size="3.6" text-anchor="middle" fill="' + C.mute + '">butoane + bilețele</text>');
    // ușa glisantă: privit când intri, panoul vine din stânga (partea butoanelor) și se închide spre dreapta
    var open = st.door || 0, w = 40 * (1 - open);
    g.push('<line x1="30" y1="102.4" x2="70" y2="102.4" stroke="' + C.line + '" stroke-width="1" stroke-dasharray="1.5 1.5"/>');
    g.push('<rect x="' + (30 - 40 * open) + '" y="100.8" width="40" height="3.2" fill="' + C.steel2 + '" stroke="' + C.ink + '" stroke-width=".8" clip-path="url(#eadoorTrack)"/>');
    g.push('<text x="50" y="110" font-family="JetBrains Mono, monospace" font-size="3.6" text-anchor="middle" fill="' + C.mute + '">ușa: când intri, stânga → dreapta</text>');
    // actori și cutie
    if (st.el) g.push(person(st.el[0], st.el[1], C.y, "EL"));
    if (st.ea) g.push(person(st.ea[0], st.ea[1], C.p, "EA"));
    if (st.box === "el" && st.el) g.push('<rect x="' + (st.el[0] - 4) + '" y="' + (st.el[1] + 5) + '" width="8" height="6" fill="' + C.wood + '" stroke="' + C.ink + '" stroke-width=".9"/>');
    if (st.box === "both" && st.el && st.ea) g.push('<rect x="' + ((st.el[0] + st.ea[0]) / 2 - 4) + '" y="' + (st.el[1] + 5) + '" width="8" height="6" fill="' + C.wood + '" stroke="' + C.ink + '" stroke-width=".9"/>');
    // camera
    var cam = st.cam;
    if (cam) {
      var ang = Math.atan2(cam.ty - cam.y, cam.tx - cam.x), f = fovOf(s.lens), L = 46;
      var a1 = ang - f / 2, a2 = ang + f / 2;
      g.push('<path d="M' + cam.x + ' ' + cam.y + ' L' + (cam.x + L * Math.cos(a1)) + ' ' + (cam.y + L * Math.sin(a1)) + ' L' + (cam.x + L * Math.cos(a2)) + ' ' + (cam.y + L * Math.sin(a2)) + ' Z" fill="rgba(255,90,31,.16)" stroke="' + C.o + '" stroke-width=".8" stroke-dasharray="2 1.4"/>');
      var deg = ang * 180 / Math.PI;
      g.push('<g transform="translate(' + cam.x + ' ' + cam.y + ') rotate(' + deg + ')"><rect x="-5" y="-3.6" width="8" height="7.2" rx="1" fill="' + C.ink + '"/><rect x="3" y="-2.2" width="3" height="4.4" fill="' + C.ink + '"/><circle cx="-1" cy="0" r="1.6" fill="' + C.o + '"/></g>');
    }
    if (s.mic) {
      g.push('<circle cx="50" cy="50" r="16" fill="none" stroke="' + C.o + '" stroke-width=".8" stroke-dasharray="2 1.5"/>');
      g.push('<rect x="47" y="43" width="6" height="10" rx="3" fill="' + C.ink + '"/><path d="M45 50 a5 5 0 0 0 10 0 M50 55 v4" fill="none" stroke="' + C.ink + '" stroke-width="1.2"/>');
    }
    document.getElementById("ea-plan").innerHTML = '<defs><clipPath id="eadoorTrack"><rect x="29.5" y="98" width="41" height="8"/></clipPath></defs>' + g.join("");
  }

  /* ---------- desen: ce vede camera ---------- */
  function frameShell(inner, s, st) {
    var hud = [];
    hud.push('<text x="5" y="8.5" font-family="JetBrains Mono, monospace" font-size="4.2" font-weight="700" fill="#fffdf8">' + s.clap + '</text>');
    if (s.fps) hud.push('<circle cx="146" cy="7" r="1.8" fill="' + C.o + '"><animate attributeName="opacity" values="1;.2;1" dur="1.2s" repeatCount="indefinite"/></circle><text x="150" y="8.5" font-family="JetBrains Mono, monospace" font-size="4" font-weight="700" fill="#fffdf8">REC</text>');
    if (document.getElementById("ea-grid").checked) {
      hud.push('<g stroke="rgba(255,253,248,.55)" stroke-width=".35"><line x1="53.3" y1="0" x2="53.3" y2="90"/><line x1="106.7" y1="0" x2="106.7" y2="90"/><line x1="0" y1="30" x2="160" y2="30"/><line x1="0" y1="60" x2="160" y2="60"/></g>');
    }
    return '<defs><clipPath id="eafr"><rect x="0" y="0" width="160" height="90"/></clipPath></defs><g clip-path="url(#eafr)">' + inner + '</g>' + hud.join("") + '<rect x=".4" y=".4" width="159.2" height="89.2" fill="none" stroke="#fffdf8" stroke-width=".8"/>';
  }

  // cadru larg, din fundul liftului spre ușă (perspectivă simplă)
  function wide(s, st) {
    var f = 70 * s.lens / 18, cx = 80, hz = 40, g = [];
    function px(x, d) { return cx - (x - 50) * f / d; }
    function py(h, d) { return hz + (52 - h) * f / d; } // h = înălțimea de la podea, în unități (1 = 2,5 cm)
    var D = 96;
    var L = px(100, D), R = px(0, D), T = py(96, D), B = py(0, D);
    g.push('<rect x="0" y="0" width="160" height="90" fill="#cfd5da"/>');
    // pereții laterali de sticlă: cer și clădiri în spatele lor
    g.push('<polygon points="0,0 ' + L + ',' + T + ' ' + L + ',' + B + ' 0,90" fill="#bcd3e2"/>');
    g.push('<polygon points="160,0 ' + R + ',' + T + ' ' + R + ',' + B + ' 160,90" fill="#c3d7e4"/>');
    g.push('<polygon points="0,52 ' + L + ',' + (B - 12) + ' ' + L + ',' + B + ' 0,90" fill="#8fa3b0" opacity=".7"/><polygon points="160,48 ' + R + ',' + (B - 14) + ' ' + R + ',' + B + ' 160,90" fill="#93a6b2" opacity=".7"/>');
    g.push('<line x1="' + (L * .5) + '" y1="' + (T * .5) + '" x2="' + (L * .5) + '" y2="' + (90 - (90 - B) * .5) + '" stroke="#e9eef1" stroke-width=".6"/><line x1="' + (160 - (160 - R) * .5) + '" y1="' + (T * .5) + '" x2="' + (160 - (160 - R) * .5) + '" y2="' + (90 - (90 - B) * .5) + '" stroke="#e9eef1" stroke-width=".6"/>');
    g.push('<polygon points="0,0 160,0 ' + R + ',' + T + ' ' + L + ',' + T + '" fill="#e9e4da"/>');
    g.push('<polygon points="0,90 160,90 ' + R + ',' + B + ' ' + L + ',' + B + '" fill="#8f8a83"/>');
    g.push('<rect x="' + L + '" y="' + T + '" width="' + (R - L) + '" height="' + (B - T) + '" fill="#c9ced3" stroke="#9aa3ab" stroke-width=".4"/>');
    // panoul cu butoane și bilețelele, pe metal, în dreapta ușii văzută din spate
    var bl = px(23, D), br = px(14, D);
    g.push('<rect x="' + bl + '" y="' + py(58, D) + '" width="' + (br - bl) + '" height="' + (py(40, D) - py(58, D)) + '" fill="#e3e7ea" stroke="#7d8b95" stroke-width=".3"/>');
    if ((st.notes || 0) > 0 || s.p === 1 && s.clap.indexOf("5B") > -1) g.push('<rect x="' + px(10, D) + '" y="' + py(54, D) + '" width="3" height="3" fill="' + C.p + '"/><rect x="' + px(9, D) + '" y="' + py(46, D) + '" width="3" height="3" fill="' + C.y + '"/>');
    // afișaj deasupra ușii
    var dl = px(56, D), dr = px(44, D), dt = py(92, D);
    g.push('<rect x="' + dl + '" y="' + dt + '" width="' + (dr - dl) + '" height="5" fill="#111"/><text x="' + ((dl + dr) / 2) + '" y="' + (dt + 4) + '" font-family="JetBrains Mono, monospace" font-size="4" font-weight="700" text-anchor="middle" fill="#ffb000">' + (st.disp || "P") + '</text>');
    // golul ușii și palierul din spatele ei
    var x0 = px(70, D), x1 = px(30, D), yt = py(84, D);
    g.push('<rect x="' + x0 + '" y="' + yt + '" width="' + (x1 - x0) + '" height="' + (B - yt) + '" fill="#f2ead8"/>');
    g.push('<rect x="' + x0 + '" y="' + (B - 3) + '" width="' + (x1 - x0) + '" height="3" fill="#cbbfa8"/>');
    // oameni, de la cel mai îndepărtat la cel mai apropiat
    var people = [];
    if (st.el) people.push({ x: st.el[0], y: st.el[1], col: C.y, who: "EL", box: st.box === "el" });
    if (st.ea) people.push({ x: st.ea[0], y: st.ea[1], col: C.p, who: "EA", lean: st.lean || 0 });
    people.sort(function (a, b) { return b.y - a.y; });
    var open = st.door || 0, panelL = x0 + (x1 - x0) * open, panelR = panelL + (x1 - x0);
    function fig(p) {
      var d = p.y - 4, s1 = f / d, foot = py(0, d), x = px(p.x, d);
      var h = 68 * s1, w = 15 * s1, head = 5.2 * s1;
      var lean = (p.lean || 0) * 3 * s1;
      var out = '<g>';
      out += '<rect x="' + (x - w / 2) + '" y="' + (foot - h * .78) + '" width="' + w + '" height="' + (h * .78) + '" rx="' + (w * .35) + '" fill="' + p.col + '" stroke="' + C.ink + '" stroke-width=".6"/>';
      out += '<circle cx="' + (x + lean) + '" cy="' + (foot - h * .78 - head * .9 + Math.abs(lean) * .4) + '" r="' + head + '" fill="#e7c3a3" stroke="' + C.ink + '" stroke-width=".6"/>';
      out += '<text x="' + x + '" y="' + (foot - h * .45) + '" font-family="JetBrains Mono, monospace" font-size="' + Math.max(2.4, 4.2 * s1) + '" font-weight="700" text-anchor="middle" fill="' + C.ink + '">' + p.who + '</text>';
      if (p.box) out += '<rect x="' + (x - w * .55) + '" y="' + (foot - h * .62) + '" width="' + (w * 1.1) + '" height="' + (w * .8) + '" fill="' + C.wood + '" stroke="' + C.ink + '" stroke-width=".6"/><text x="' + x + '" y="' + (foot - h * .62 + w * .5) + '" font-family="Caveat, cursive" font-size="' + Math.max(2.2, 4 * s1) + '" text-anchor="middle" fill="' + C.ink + '">FRAGIL</text>';
      return out + '</g>';
    }
    people.forEach(function (p) {
      if (p.y > 100) g.push('<g clip-path="url(#eagap)">' + fig(p) + '</g>');
    });
    // panoul ușii
    g.push('<rect x="' + panelL + '" y="' + yt + '" width="' + (x1 - x0) + '" height="' + (B - yt) + '" fill="#aeb7bf" stroke="#7c868f" stroke-width=".5" clip-path="url(#eadoor)"/>');
    people.forEach(function (p) { if (p.y <= 100) g.push(fig(p)); });
    // cutia dusă de amândoi
    if (st.box === "both" && st.el && st.ea) {
      var d = st.el[1] - 4, s1 = f / d, xm = px((st.el[0] + st.ea[0]) / 2, d), foot = py(0, d), w = 18 * s1;
      var inside = st.el[1] <= 100;
      var bx = '<rect x="' + (xm - w / 2) + '" y="' + (foot - 68 * s1 * .58) + '" width="' + w + '" height="' + (w * .7) + '" fill="' + C.wood + '" stroke="' + C.ink + '" stroke-width=".6"/><text x="' + xm + '" y="' + (foot - 68 * s1 * .58 + w * .45) + '" font-family="Caveat, cursive" font-size="' + Math.max(2.4, 5 * s1) + '" text-anchor="middle" fill="' + C.ink + '">FRAGIL</text>';
      g.push(inside ? bx : '<g clip-path="url(#eagap)">' + bx + '</g>');
    }
    var defs = '<defs><clipPath id="eagap"><rect x="' + x0 + '" y="' + yt + '" width="' + Math.max(0, Math.min(x1, panelL) - x0) + '" height="' + (B - yt) + '"/></clipPath><clipPath id="eadoor"><rect x="' + x0 + '" y="' + yt + '" width="' + (x1 - x0) + '" height="' + (B - yt) + '"/></clipPath></defs>';
    return defs + g.join("");
  }

  function face(s, st) {
    var ea = s.face === "ea", col = ea ? C.p : C.y, g = [];
    var bg = s.landing ? "#efe4cf" : "#c6cdd3";
    g.push('<rect width="160" height="90" fill="' + bg + '"/>');
    if (!s.landing) g.push('<rect width="160" height="90" fill="#c3d7e4"/><rect x="96" y="44" width="16" height="46" fill="#9fb2be"/><rect x="116" y="30" width="22" height="60" fill="#8fa3b0"/><rect x="140" y="52" width="20" height="38" fill="#a6b8c3"/><line x1="92" y1="0" x2="92" y2="90" stroke="#e9eef1" stroke-width=".8"/>');
    else g.push('<rect x="120" y="8" width="30" height="82" fill="' + C.wood + '" opacity=".65"/>');
    // pe stânga cadrului, privirea spre dreapta, cu aer în direcția privirii
    var cx = 62, look = st.look || 0, up = st.up || 0, down = st.down || 0;
    g.push('<path d="M22 90 C26 66 44 60 62 60 C80 60 98 66 102 90 Z" fill="' + col + '" stroke="' + C.ink + '" stroke-width=".8"/>');
    g.push('<rect x="55" y="50" width="14" height="14" fill="#e7c3a3"/>');
    if (ea) g.push('<path d="M38 74 C34 40 40 14 62 12 C84 14 90 40 86 74 L80 74 C82 50 78 30 62 28 C46 30 42 50 44 74 Z" fill="#6b3f26"/>');
    g.push('<ellipse cx="' + cx + '" cy="38" rx="17" ry="21" fill="#e7c3a3" stroke="' + C.ink + '" stroke-width=".8"/>');
    if (!ea) g.push('<path d="M44 34 C42 16 54 10 64 11 C76 12 82 20 80 34 C74 26 66 24 58 27 C52 29 48 31 44 34 Z" fill="#2c241f"/>');
    else g.push('<path d="M45 34 C46 18 56 14 64 14 C74 15 80 22 80 33 C72 24 60 22 45 34 Z" fill="#6b3f26"/>');
    var ex = 6 + look * 2.4, ey = 36 - up * 2.6 + down * 2.2;
    g.push('<ellipse cx="' + (cx - 6 + ex * .3) + '" cy="' + ey + '" rx="2" ry="' + (down > .5 ? 1 : 2.2) + '" fill="#2a1d14"/><ellipse cx="' + (cx + 7 + ex * .3) + '" cy="' + ey + '" rx="2" ry="' + (down > .5 ? 1 : 2.2) + '" fill="#2a1d14"/>');
    var sm = st.smile || 0, mw = 7 + Math.abs(sm) * 2, my = 49;
    if (st.laugh > .5) g.push('<path d="M' + (cx - mw) + ' ' + (my - 1) + ' Q' + cx + ' ' + (my + 7) + ' ' + (cx + mw) + ' ' + (my - 1) + ' Z" fill="#7a2c2c"/>');
    else g.push('<path d="M' + (cx - mw) + ' ' + my + ' Q' + cx + ' ' + (my + sm * 6) + ' ' + (cx + mw) + ' ' + my + '" fill="none" stroke="#7a2c2c" stroke-width="1.4" stroke-linecap="round"/>');
    if (st.handUp) g.push('<ellipse cx="' + cx + '" cy="' + (90 - st.handUp * 40) + '" rx="10" ry="8" fill="#e7c3a3" stroke="' + C.ink + '" stroke-width=".6"/>');
    // focus pe ochiul apropiat + direcția privirii
    g.push('<rect x="' + (cx - 11) + '" y="' + (ey - 4) + '" width="10" height="8" fill="none" stroke="#7cf06b" stroke-width=".6"/>');
    g.push('<path d="M86 30 h' + (22 + look * 6) + '" stroke="rgba(20,20,20,.55)" stroke-width=".7" stroke-dasharray="2 1.4" marker-end="url(#eaarr)"/>');
    g.push('<text x="98" y="25" font-family="JetBrains Mono, monospace" font-size="3.3" fill="' + C.ink + '">aer în direcția privirii</text>');
    g.push('<text x="' + (cx - 26) + '" y="' + (ey - 6) + '" font-family="JetBrains Mono, monospace" font-size="3.4" fill="#2f6b2a">focus</text>');
    return '<defs><marker id="eaarr" viewBox="0 0 6 6" refX="5" refY="3" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0 L6 3 L0 6 Z" fill="rgba(20,20,20,.6)"/></marker></defs>' + g.join("");
  }

  var NOTES = [
    { t: "Mersi pentru ușă. – 3", c: C.p, x: 30, y: 16, r: -4 },
    { t: "Oricând. – 2", c: C.y, x: 32, y: 44, r: 3 },
    { t: "Ai mutat dulapul la 2 noaptea?", c: C.p, x: 66, y: 14, r: -2 },
    { t: "Scuze. Am și cântat?", c: C.y, x: 68, y: 44, r: 4 },
    { t: "Da. Fals.", c: C.p, x: 102, y: 18, r: 3 },
    { t: "Pizza în plus. Vrei?", c: C.y, x: 100, y: 48, r: -3 }
  ];
  function noteSvg(n, x, y, r, big) {
    var w = big ? 34 : 26;
    var words = n.t.split(" "), lines = [], line = "";
    words.forEach(function (wd) { if ((line + " " + wd).trim().length > (big ? 10 : 11)) { lines.push(line.trim()); line = wd; } else line += " " + wd; });
    lines.push(line.trim());
    var txt = lines.map(function (l, i) { return '<tspan x="' + (w / 2) + '" dy="' + (i ? (big ? 7 : 5.4) : 0) + '">' + l + '</tspan>'; }).join("");
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ' ' + (w / 2) + ' ' + (w / 2) + ')"><rect width="' + w + '" height="' + w + '" fill="' + n.c + '" stroke="rgba(20,20,20,.25)" stroke-width=".3"/><rect x="' + (w * .3) + '" y="-2" width="' + (w * .4) + '" height="4" fill="rgba(255,253,248,.7)"/><text y="' + (big ? 11 : 9) + '" font-family="Caveat, cursive" font-weight="700" font-size="' + (big ? 7 : 5.4) + '" text-anchor="middle" fill="' + C.ink + '">' + txt + '</text></g>';
  }
  function mirror(s, st) {
    var g = ['<rect width="160" height="90" fill="#c9ced3"/>', '<polygon points="0,0 70,0 20,90 0,90" fill="rgba(255,255,255,.22)"/>',
      '<rect x="140" y="10" width="14" height="60" rx="1.5" fill="#e3e7ea" stroke="#7d8b95" stroke-width=".6"/>'];
    ["3", "2", "1", "P"].forEach(function (l, i) { g.push('<circle cx="147" cy="' + (20 + i * 13) + '" r="4" fill="#eef1f3" stroke="#5f6a73" stroke-width=".5"/><text x="147" y="' + (21.6 + i * 13) + '" font-family="JetBrains Mono, monospace" font-size="4" font-weight="700" text-anchor="middle" fill="#141414">' + l + '</text>'); });
    var n = Math.round(st.notes || 0);
    if (n === -1) g.push(noteSvg({ t: "Mă mut.", c: C.y }, 63, 24, 2, true));
    for (var i = 0; i < Math.max(0, n); i++) g.push(noteSvg(NOTES[i], NOTES[i].x, NOTES[i].y, NOTES[i].r));
    if (s.hand && st.hand) {
      var hx = 175 - st.hand * 62;
      g.push('<g transform="translate(' + hx + ' 50)"><rect x="0" y="0" width="40" height="13" rx="6" fill="#e7c3a3" stroke="' + C.ink + '" stroke-width=".6"/><rect x="-6" y="-8" width="20" height="20" fill="' + C.p + '" transform="rotate(-6)"/></g>');
    }
    return g.join("");
  }
  function button(s, st) {
    var g = ['<rect width="160" height="90" fill="#b9c1c8"/>', '<rect x="56" y="8" width="48" height="76" rx="2" fill="#d4dade" stroke="#7d8b95"/>'];
    var labels = [["3", 18], ["2", 32], ["1", 46], ["P", 60]];
    labels.forEach(function (l) {
      var lit = (!s.elbow && l[0] === "3" && st.press > .5);
      g.push('<circle cx="80" cy="' + l[1] + '" r="5.5" fill="' + (lit ? "#ffb000" : "#eef1f3") + '" stroke="#5f6a73" stroke-width=".7"/><text x="80" y="' + (l[1] + 2) + '" font-family="JetBrains Mono, monospace" font-size="5" font-weight="700" text-anchor="middle" fill="' + C.ink + '">' + l[0] + '</text>');
    });
    g.push('<g transform="translate(66 72)"><circle cx="0" cy="0" r="4.6" fill="#eef1f3" stroke="#5f6a73" stroke-width=".7"/><path d="M-2.5 -1.5 l-1.4 1.5 l1.4 1.5 M2.5 -1.5 l1.4 1.5 l-1.4 1.5" stroke="' + C.ink + '" stroke-width=".7" fill="none"/></g>');
    g.push('<text x="66" y="83" font-family="JetBrains Mono, monospace" font-size="3" text-anchor="middle" fill="' + C.ink + '">deschide</text>');
    var p = st.press || 0;
    if (s.elbow) g.push('<g transform="translate(' + (160 - p * 86) + ' ' + (60 + p * 8) + ') rotate(-12)"><rect x="0" y="-9" width="70" height="20" rx="9" fill="' + C.y + '" stroke="' + C.ink + '" stroke-width=".7"/><text x="30" y="4" font-family="JetBrains Mono, monospace" font-size="4" fill="' + C.ink + '">cotul Lui</text></g>');
    else g.push('<g transform="translate(' + (160 - p * 78) + ' ' + (18 - 2) + ')"><rect x="0" y="-3" width="70" height="7" rx="3.5" fill="#e7c3a3" stroke="' + C.ink + '" stroke-width=".6"/></g>');
    return g.join("");
  }
  function display(s, st) {
    return '<rect width="160" height="90" fill="#c9cfd4"/><rect x="40" y="20" width="80" height="44" rx="3" fill="#0d0d0d" stroke="#5f6a73" stroke-width="1.2"/>' +
      '<text x="80" y="54" font-family="JetBrains Mono, monospace" font-size="32" font-weight="700" text-anchor="middle" fill="#ffb000">' + (st.floor || "P") + '</text>' +
      '<path d="M108 30 l5 -6 l5 6" fill="none" stroke="#ffb000" stroke-width="1.4"/><text x="80" y="76" font-family="JetBrains Mono, monospace" font-size="4" text-anchor="middle" fill="' + C.ink + '">P · 1 · 2 · 3</text>';
  }
  function phone(s, st) {
    var m = st.msg || 0;
    return '<rect width="160" height="90" fill="#3b3833"/><rect x="58" y="4" width="44" height="86" rx="6" fill="#111"/><rect x="61" y="9" width="38" height="78" rx="3" fill="#f4f1ea"/>' +
      '<g opacity="' + m + '" transform="translate(0 ' + (6 - m * 6) + ')"><rect x="64" y="40" width="31" height="13" rx="4" fill="' + C.p + '"/><text x="79.5" y="48.3" font-family="Inter, sans-serif" font-size="4" font-weight="600" text-anchor="middle" fill="' + C.ink + '">Coborâm împreună?</text></g>' +
      '<text x="80" y="18" font-family="Inter, sans-serif" font-size="3.6" font-weight="700" text-anchor="middle" fill="' + C.ink + '">Ea</text>';
  }
  function landing(s, st) {
    var p = st.push || 0, sc = 1 + p * .9, o = st.door || 0;
    var g = ['<rect width="160" height="90" fill="#e8dfcd"/><rect x="0" y="66" width="160" height="24" fill="#b9ab92"/>'];
    g.push('<g transform="translate(' + (100 - p * 30) + ' 66) scale(' + sc + ') translate(-100 -66)">');
    g.push('<rect x="96" y="14" width="30" height="52" fill="' + C.wood + '" stroke="' + C.ink + '" stroke-width=".6"/><circle cx="121" cy="42" r="1.2" fill="' + C.ink + '"/><rect x="92" y="64" width="38" height="3" fill="#7a6a52"/>');
    g.push('<rect x="78" y="50" width="16" height="16" fill="#c49a6c" stroke="' + C.ink + '" stroke-width=".5"/><rect x="96" y="54" width="14" height="12" fill="#b88d5f" stroke="' + C.ink + '" stroke-width=".5"/><rect x="82" y="38" width="18" height="12" fill="#cfa776" stroke="' + C.ink + '" stroke-width=".5"/>');
    g.push('<text x="91" y="46" font-family="Caveat, cursive" font-size="5" font-weight="700" text-anchor="middle" fill="' + C.ink + '">FRAGIL</text><rect x="86" y="40" width="7" height="6" fill="' + C.y + '" transform="rotate(-6 89 43)"/>');
    g.push('</g>');
    // tocul liftului care iese din cadru, cu panoul care se retrage spre dreapta
    var lw = 30 * (1 - p);
    if (lw > 1) {
      g.push('<rect x="0" y="0" width="' + lw + '" height="90" fill="#9aa3ab"/><rect x="' + (160 - lw) + '" y="0" width="' + lw + '" height="90" fill="#9aa3ab"/>');
      var pw = (160 - 2 * lw) * (1 - o);
      g.push('<rect x="' + (160 - lw - pw) + '" y="0" width="' + pw + '" height="90" fill="#aeb7bf" stroke="#7c868f" stroke-width=".6"/>');
    }
    return g.join("");
  }
  function stairs(s, st) {
    var p = st.push || 0, sc = 1 + p * .8, sh = st.shrug || 0;
    var g = ['<rect width="160" height="90" fill="#e2d9c7"/><rect x="0" y="70" width="160" height="20" fill="#b9ab92"/>'];
    g.push('<g transform="translate(80 60) scale(' + sc + ') translate(-80 -60)">');
    g.push('<rect x="60" y="62" width="40" height="18" fill="#b88d5f" stroke="' + C.ink + '" stroke-width=".5"/>');
    g.push('<rect x="64" y="' + (40 - sh * 3) + '" width="32" height="30" rx="8" fill="' + C.y + '" stroke="' + C.ink + '" stroke-width=".6"/>');
    g.push('<circle cx="80" cy="' + (32 - sh * 2) + '" r="9" fill="#e7c3a3" stroke="' + C.ink + '" stroke-width=".6"/><path d="M71 28 C71 20 89 20 89 28 C84 25 76 25 71 28 Z" fill="#2c241f"/>');
    g.push('<rect x="66" y="52" width="28" height="18" fill="' + C.wood + '" stroke="' + C.ink + '" stroke-width=".6"/><text x="80" y="63" font-family="Caveat, cursive" font-size="6" font-weight="700" text-anchor="middle" fill="' + C.ink + '">FRAGIL</text>');
    g.push('</g>');
    return g.join("");
  }
  function boxClose(extra) {
    return '<rect width="160" height="90" fill="#b88d5f"/><rect x="0" y="36" width="160" height="14" fill="#a87c4f" opacity=".7"/>' + extra;
  }
  function boxnote(s, st) {
    var blur = (1 - (st.focus || 0)) * 2.2;
    return '<defs><filter id="eabl"><feGaussianBlur stdDeviation="' + blur + '"/></filter></defs>' + boxClose('<g filter="url(#eabl)"><text x="34" y="74" font-family="Caveat, cursive" font-size="14" font-weight="700" fill="' + C.ink + '">FRAGIL</text>' + noteSvg({ t: "Mă mut. La tine. (Dacă vrei.)", c: C.y }, 86, 16, -4, true) + '</g>');
  }
  function boxhand(s, st) {
    var h = st.hand || 0;
    return boxClose('<text x="30" y="58" font-family="Caveat, cursive" font-size="26" font-weight="700" fill="' + C.ink + '">FRAGIL</text><g transform="translate(' + (170 - h * 70) + ' ' + (30 + h * 6) + ') rotate(-8)"><rect x="0" y="0" width="70" height="26" rx="12" fill="#e7c3a3" stroke="' + C.ink + '" stroke-width=".6"/><rect x="-4" y="2" width="14" height="6" rx="3" fill="#e7c3a3" stroke="' + C.ink + '" stroke-width=".5"/><rect x="-4" y="10" width="14" height="6" rx="3" fill="#e7c3a3" stroke="' + C.ink + '" stroke-width=".5"/></g>');
  }
  function boxtext(s, st) {
    var x = 10 - (st.slide || 0) * 60;
    return boxClose('<text x="' + x + '" y="64" font-family="Caveat, cursive" font-size="40" font-weight="700" fill="' + C.ink + '">FRAGIL ↑ FRAGIL</text>');
  }
  function tape(s, st) {
    var t = st.tape || 0;
    return boxClose('<rect x="0" y="38" width="' + (20 + t * 120) + '" height="10" fill="#d9b483" opacity=".95"/><g transform="translate(' + (20 + t * 120) + ' 30)"><rect x="-6" y="0" width="22" height="26" rx="6" fill="#d8c8b8" stroke="' + C.ink + '" stroke-width=".6"/><circle cx="5" cy="13" r="7" fill="none" stroke="' + C.ink + '" stroke-width="1.2"/></g>');
  }
  function sound(s, st) {
    var g = ['<rect width="160" height="90" fill="#22201d"/>'];
    var ph = (st.wave || 0) * Math.PI * 6;
    var pts = [];
    for (var x = 8; x <= 152; x += 2) pts.push(x + "," + (45 + Math.sin(x * .25 + ph) * (x > 60 && x < 100 ? 16 : 4) * Math.sin(x * .07)));
    g.push('<polyline points="' + pts.join(" ") + '" fill="none" stroke="#ffb000" stroke-width="1.2"/>');
    g.push('<text x="80" y="80" font-family="JetBrains Mono, monospace" font-size="4.4" text-anchor="middle" fill="#fffdf8">liniște · clinchet · ușă · butoane · bandă</text>');
    return g.join("");
  }
  var VIEWS = { wide: wide, face: face, mirror: mirror, button: button, display: display, phone: phone, landing: landing, stairs: stairs, boxnote: boxnote, boxhand: boxhand, boxtext: boxtext, tape: tape, sound: sound };

  /* ---------- interfață ---------- */
  var idx = 0, t0 = performance.now(), playing = true, DUR = 4600, HOLD = 900, visible = false;
  var sec = document.getElementById("e5-animatic");
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) t0 = performance.now(); }, { threshold: .15 }).observe(sec); else visible = true;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) playing = false;
  var $ = function (id) { return document.getElementById(id); };
  var stepsEl = $("ea-steps"), posEl = $("ea-positions");
  POS.forEach(function (p) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "ea-pos-chip";
    b.innerHTML = "<b>" + p.n + " · " + p.name + "</b><span>" + p.time + "</span>";
    b.addEventListener("click", function () { go(S.findIndex(function (s) { return s.p === p.n; })); });
    posEl.appendChild(b);
  });
  var btns = [];
  S.forEach(function (s, i) {
    if (i === 0 || S[i - 1].p !== s.p) {
      var h = document.createElement("li"); h.className = "ea-group";
      h.textContent = "Poziția " + s.p + " · " + POS[s.p - 1].name + " · " + POS[s.p - 1].time;
      stepsEl.appendChild(h);
    }
    var li = document.createElement("li"), b = document.createElement("button");
    b.type = "button"; b.className = "ea-step";
    b.innerHTML = '<span class="ea-n">' + String(i + 1).padStart(2, "0") + '</span><span class="ea-c">' + s.clap + '</span><span class="ea-t">' + s.title + "</span>";
    b.addEventListener("click", function () { go(i); });
    li.appendChild(b); stepsEl.appendChild(li); btns.push(b);
  });
  function fill(s, i) {
    $("ea-clap").textContent = s.clap;
    $("ea-outfit").textContent = s.fit === "fără actori" ? "fără actori" : "ținuta " + s.fit;
    var who = $("ea-who"); who.textContent = s.who;
    who.className = "ea-pill" + (/^El/.test(s.who) && !/Ea/.test(s.who) ? " ea-y" : /Ea/.test(s.who) && !/El/.test(s.who) ? " ea-p" : "");
    $("ea-title").textContent = s.title;
    $("ea-desc").textContent = s.desc;
    $("ea-tips").innerHTML = s.tips.map(function (t) { return "<li><span>" + t + "</span></li>"; }).join("");
    $("ea-posTag").textContent = "Poziția " + s.p + " · " + POS[s.p - 1].name;
    $("ea-lensTag").textContent = s.lens ? s.lens + " mm · " + s.fps + " fps" : "doar sunet";
    $("ea-counter").textContent = "Pasul " + String(i + 1).padStart(2, "0") + " / " + S.length;
    btns.forEach(function (b, j) { b.classList.toggle("ea-on", j === i); });
    [].forEach.call(posEl.children, function (c, j) { c.classList.toggle("ea-on", j + 1 === s.p); });
    var cur = btns[i]; if (cur && cur.scrollIntoViewIfNeeded) {}
  }
  function go(i) {
    idx = (i + S.length) % S.length;
    t0 = performance.now();
    fill(S[idx], idx);
    if (!playing) render(1);
  }
  function render(t) {
    var s = S[idx], st = stateAt(s, Math.min(1, Math.max(0, t)));
    drawPlan(s, st);
    $("ea-frame").innerHTML = frameShell(VIEWS[s.view](s, st), s, st);
    $("ea-bar").style.width = (t * 100).toFixed(1) + "%";
  }
  function loop(now) {
    if (playing && visible) {
      var e = now - t0, t = Math.min(1, e / DUR);
      render(t);
      if (e > DUR + HOLD) {
        if ($("ea-auto").checked) go(idx + 1); else t0 = now;
      }
    }
    requestAnimationFrame(loop);
  }
  $("ea-play").addEventListener("click", function () {
    playing = !playing;
    this.textContent = playing ? "❚❚ Pauză" : "▶ Redă";
    if (playing) t0 = performance.now();
  });
  $("ea-prev").addEventListener("click", function () { go(idx - 1); });
  $("ea-next").addEventListener("click", function () { go(idx + 1); });
  $("ea-grid").addEventListener("change", function () { if (!playing) render(1); });
  addEventListener("keydown", function (e) {
    if (!visible || (e.target.closest && e.target.closest("input"))) return;
    if (e.key === "ArrowRight") go(idx + 1);
    if (e.key === "ArrowLeft") go(idx - 1);
  });
  if (!playing) $("ea-play").textContent = "▶ Redă";
  go(0);
  render(playing ? 0 : 1);
  requestAnimationFrame(loop);
})();
