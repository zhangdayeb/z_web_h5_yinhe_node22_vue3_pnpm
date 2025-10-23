// src/data/lunbop.ts

// 原始中奖用户列表数据 - 只保留图片，其他数据动态生成
const originalWinnerList = [
  {
    gameImage: '/src/assets/mobile/lunbo/1.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/2.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/3.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/4.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/5.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/6.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/7.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/8.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/9.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/10.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/11.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/a.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/b.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/c.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/d.jpg'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/e.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/f.png'
  },
  {
    gameImage: '/src/assets/mobile/lunbo/g.png'
  }
] as const;

// 生成随机用户名
function generateRandomUsername(): string {
  const firstDigit = Math.floor(Math.random() * 9) + 1; // 1-9
  const lastTwoDigits = Math.floor(Math.random() * 99) + 1; // 1-99
  const formattedLastDigits = lastTwoDigits.toString().padStart(2, '0'); // 01-99
  return `${firstDigit}***${formattedLastDigits}`;
}

// 生成随机金额
function generateRandomAmount(): string {
  const amount = Math.floor(Math.random() * 471) + 30; // 30-500
  // 随机添加K后缀（大部分情况）或直接显示数字
 // const shouldAddK = Math.random() > 0.2; // 80%的概率加K
  return `${amount}K`;
}

// 检查是否有相邻重复的图片
function hasAdjacentDuplicates(list: WinnerItem[]): boolean {
  for (let i = 0; i < list.length - 1; i++) {
    if (list[i].gameImage === list[i + 1].gameImage) {
      return true;
    }
  }
  return false;
}

// 打乱数组并确保没有相邻重复
function shuffleWithoutAdjacentDuplicates(array: WinnerItem[]): WinnerItem[] {
  const shuffled = [...array];
  let attempts = 0;
  const maxAttempts = 100;

  do {
    // Fisher-Yates 洗牌算法
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    attempts++;
  } while (hasAdjacentDuplicates(shuffled) && attempts < maxAttempts);

  // 如果经过多次尝试仍有相邻重复，进行手动调整
  if (hasAdjacentDuplicates(shuffled)) {
    return fixAdjacentDuplicates(shuffled);
  }

  return shuffled;
}

// 手动修复相邻重复
function fixAdjacentDuplicates(array: WinnerItem[]): WinnerItem[] {
  const fixed = [...array];

  for (let i = 0; i < fixed.length - 1; i++) {
    if (fixed[i].gameImage === fixed[i + 1].gameImage) {
      // 找到下一个不同的元素进行交换
      for (let j = i + 2; j < fixed.length; j++) {
        if (fixed[j].gameImage !== fixed[i].gameImage) {
          [fixed[i + 1], fixed[j]] = [fixed[j], fixed[i + 1]];
          break;
        }
      }
    }
  }

  return fixed;
}

// 随机打乱数组并返回指定数量的元素，确保没有相邻重复
function getRandomWinners(count: number = 20): WinnerItem[] {
  // 如果需要的数量大于原始数据长度，先复制数据
  let extendedList: WinnerItem[] = [];

  // 计算需要复制几次
  const copiesNeeded = Math.ceil(count / originalWinnerList.length);
  for (let i = 0; i < copiesNeeded; i++) {
    // 每次复制时都生成新的随机数据
    const newBatch = originalWinnerList.map(item => ({
      gameImage: item.gameImage,
      username: generateRandomUsername(),
      amount: generateRandomAmount()
    }));
    extendedList.push(...newBatch);
  }

  // 打乱数组并确保没有相邻重复
  const shuffled = shuffleWithoutAdjacentDuplicates(extendedList);

  // 返回前 count 个元素
  return shuffled.slice(0, count);
}

// 获取固定数量的随机中奖列表（20个）
export function getWinnerList(): WinnerItem[] {
  return getRandomWinners(20);
}

// 获取指定数量的随机中奖列表
export function getWinnerListByCount(count: number): WinnerItem[] {
  return getRandomWinners(count);
}

// 导出原始数据（如果需要的话）
export { originalWinnerList };

// 导出类型定义
export type WinnerItem = {
  gameImage: string;
  username: string;
  amount: string;
};

export type WinnerList = WinnerItem[];
