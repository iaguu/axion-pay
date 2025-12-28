export function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

export function maskCpf(value) {
  const digits = onlyDigits(value).slice(0, 11);
  const parts = [];
  if (digits.length > 0) parts.push(digits.slice(0, 3));
  if (digits.length > 3) parts.push(digits.slice(3, 6));
  if (digits.length > 6) parts.push(digits.slice(6, 9));
  const tail = digits.length > 9 ? digits.slice(9, 11) : "";
  return parts.join(".") + (tail ? `-${tail}` : "");
}

export function maskCnpj(value) {
  const digits = onlyDigits(value).slice(0, 14);
  const part1 = digits.slice(0, 2);
  const part2 = digits.slice(2, 5);
  const part3 = digits.slice(5, 8);
  const part4 = digits.slice(8, 12);
  const part5 = digits.slice(12, 14);
  let result = part1;
  if (part2) result += `.${part2}`;
  if (part3) result += `.${part3}`;
  if (part4) result += `/${part4}`;
  if (part5) result += `-${part5}`;
  return result;
}

export function maskPhone(value) {
  const digits = onlyDigits(value).slice(0, 11);
  const ddd = digits.slice(0, 2);
  const middle = digits.slice(2, digits.length > 10 ? 7 : 6);
  const end = digits.slice(digits.length > 10 ? 7 : 6);
  if (!ddd) return "";
  let result = `(${ddd})`;
  if (middle) result += ` ${middle}`;
  if (end) result += `-${end}`;
  return result;
}

export function isValidCpf(value) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;
  const digits = cpf.split("").map((char) => Number(char));
  let sum = 0;
  for (let i = 0; i < 9; i += 1) {
    sum += digits[i] * (10 - i);
  }
  let firstCheck = (sum * 10) % 11;
  if (firstCheck === 10) firstCheck = 0;
  if (firstCheck !== digits[9]) return false;
  sum = 0;
  for (let i = 0; i < 10; i += 1) {
    sum += digits[i] * (11 - i);
  }
  let secondCheck = (sum * 10) % 11;
  if (secondCheck === 10) secondCheck = 0;
  return secondCheck === digits[10];
}
