import { uniqueUsernameGenerator } from 'unique-username-generator';

export function generateMemorable(length: number = 10): string {
  const vowels = 'aeiouAEIOU';
  const consonants = 'bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ';
  const randomString = [];

  for (let i = 0; i < length; i++) {
    const type = i % 2 === 0 ? consonants : vowels;
    randomString.push(type.charAt(Math.floor(Math.random() * type.length)));
  }

  return randomString.join('');
}

export function generateNumberUnique(length: number = 8) {
  const part = Math.floor(length / 6);
  const mod = length % 6;
  let result = '';
  for (let i = 0; i <= part - 1; i++) {
    result += uniqueUsernameGenerator({
      dictionaries: [],
      randomDigits: 6,
    });
  }
  if (mod > 0) {
    result += uniqueUsernameGenerator({
      dictionaries: [],
      randomDigits: mod,
    });
  }
  return result;
}
