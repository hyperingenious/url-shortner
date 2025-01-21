
function generateRandomAlias() {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  let alias = '';

  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * letters.length);
    alias += letters[randomIndex];
  }

  return alias;
}


module.exports = { generateRandomAlias }