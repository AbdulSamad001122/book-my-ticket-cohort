import bcrypt from "bcryptjs";


export async function hashPass(enteredPassword) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(enteredPassword, salt);

  return hash;
}

export async function comparePass(enteredPassword, storedHashedPassword) {
  const isMatch = await bcrypt.compare(enteredPassword, storedHashedPassword);

  return isMatch;
}
