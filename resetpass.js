const bcrypt = require('bcryptjs');

async function main() {
  const hash = await bcrypt.hash('Admin1234!', 12);
  console.log(hash);
}

main();