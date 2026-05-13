/* =========================================
   Auto Campaign - Vehicle catalog
   10 campaign vehicles.
   ========================================= */

const PRODUCTS = [
  {
    id: 1,
    name: "Tesla Model 3",
    category: "Sedan",
    description: "All-electric sedan with up to 358 miles of range, Autopilot included, and a minimalist interior with a 15.4\" touchscreen.",
    image: "assets/produtos/car-01.jpg"
  },
  {
    id: 2,
    name: "Tesla Model Y",
    category: "SUV",
    description: "Compact electric SUV with dual motor AWD, up to 330 miles range, spacious cargo area and seating for up to 7.",
    image: "assets/produtos/car-02.jpg"
  },
  {
    id: 3,
    name: "Honda Civic Sport",
    category: "Compact",
    description: "Sport-tuned suspension, turbocharged 1.5L engine, and a bold exterior with 18-inch wheels and sport pedals.",
    image: "assets/produtos/car-03.jpg"
  },
  {
    id: 4,
    name: "Toyota Corolla XSE",
    category: "Sedan",
    description: "Premium trim with sporty 18-inch wheels, JBL audio, heated front seats and Toyota Safety Sense 3.0.",
    image: "assets/produtos/car-04.jpg"
  },
  {
    id: 5,
    name: "Jeep Wrangler",
    category: "SUV",
    description: "Iconic off-road SUV with removable doors and roof, Trail Rated 4x4 capability and a 3.6L Pentastar V6 engine.",
    image: "assets/produtos/car-05.jpg",
    soldOut: true
  },
  {
    id: 6,
    name: "Ford Mustang EcoBoost",
    category: "Sport",
    description: "2.3L EcoBoost 4-cylinder producing 330 hp, SYNC 4 infotainment, and the legendary Mustang pony car heritage.",
    image: "assets/produtos/car-06.jpg",
    soldOut: true
  },
  {
    id: 7,
    name: "Mazda3",
    category: "Compact",
    description: "Premium compact with a refined cabin, standard i-Activ AWD, 10.25-inch infotainment and MAZDA CONNECT.",
    image: "assets/produtos/car-07.jpg"
  },
  {
    id: 8,
    name: "Volkswagen Jetta GLI",
    category: "Sedan",
    description: "Sport sedan with a turbocharged 2.0L TSI 228 hp engine, 6-speed DSG, and DCC adaptive suspension.",
    image: "assets/produtos/car-08.jpg"
  },
  {
    id: 9,
    name: "Subaru WRX",
    category: "Sport",
    description: "All-wheel drive sport sedan with a 2.4L turbocharged Boxer engine, 271 hp and Subaru EyeSight driver assist.",
    image: "assets/produtos/car-09.jpg"
  },
  {
    id: 10,
    name: "Kia K5 GT",
    category: "Sedan",
    description: "Performance-focused sedan with a turbocharged 2.5L engine producing 290 hp, dual-clutch transmission and sport-tuned AWD.",
    image: "assets/produtos/car-10.jpg",
    soldOut: true
  }
];

function getProductById(id) {
  return PRODUCTS.find(function (p) { return p.id === id; });
}
