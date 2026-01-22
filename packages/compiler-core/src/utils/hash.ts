import XXH from 'xxhashjs';

export function genHashByXXH(str: string): string {
  // 使用32位哈希，种子可自定义（0xABCD）
  return XXH.h32(str, 0xabcd).toString(16); // 返回16进制字符串
}

export function randomHash(length = 6): string {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset.charAt(randomIndex);
  }

  return result;
}
