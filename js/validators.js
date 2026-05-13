/* =========================================
   Cookware Campaign - Validators and masks
   ========================================= */

const Validators = {

  email: function (value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
  },

  /* Last 4 digits of SSN — must be exactly 4 digits */
  cpf: function (value) {
    const digits = String(value).replace(/\D/g, '');
    return digits.length === 4;
  },

  /* US phone: 10 digits */
  phone: function (value) {
    const digits = String(value).replace(/\D/g, '');
    return digits.length === 10;
  },

  /* US ZIP code: 5 digits */
  cep: function (value) {
    return String(value).replace(/\D/g, '').length === 5;
  },

  required: function (value) {
    return String(value || '').trim().length > 0;
  },

  state: function (value) {
    return /^[A-Z]{2}$/.test(String(value).toUpperCase());
  }
};

const Masks = {

  apply: function (input, formatter) {
    input.addEventListener('input', function () {
      const start = input.selectionStart;
      const before = input.value;
      const formatted = formatter(before);
      input.value = formatted;
      if (start === before.length) {
        input.setSelectionRange(formatted.length, formatted.length);
      }
    });
  },

  /* Last 4 digits of SSN — digits only, max 4 */
  cpf: function (value) {
    return String(value).replace(/\D/g, '').slice(0, 4);
  },

  /* US phone: (555) 555-0000 */
  phone: function (value) {
    const v = String(value).replace(/\D/g, '').slice(0, 10);
    if (v.length === 0) return '';
    if (v.length <= 3) return '(' + v;
    if (v.length <= 6) return '(' + v.slice(0, 3) + ') ' + v.slice(3);
    return '(' + v.slice(0, 3) + ') ' + v.slice(3, 6) + '-' + v.slice(6);
  },

  /* US ZIP code: 5 digits only */
  cep: function (value) {
    return String(value).replace(/\D/g, '').slice(0, 5);
  }
};

/**
 * Looks up a US address by ZIP code using Zippopotam.us API.
 * Returns null if not found.
 */
function fetchAddressByCEP(zip) {
  const clean = String(zip).replace(/\D/g, '');
  if (clean.length !== 5) return Promise.resolve(null);

  return fetch('https://api.zippopotam.us/us/' + clean)
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (data) {
      if (!data || !data.places || !data.places[0]) return null;
      const place = data.places[0];
      return {
        street:   '',
        district: place['place name'] || '',
        city:     place['place name'] || '',
        state:    place['state abbreviation'] || ''
      };
    })
    .catch(function () { return null; });
}
