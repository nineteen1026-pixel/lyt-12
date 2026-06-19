import type {
  VillagerDetail,
  DialogueNode,
  ExclusiveOrderTemplate,
  StorylineReward,
  AffinityStage,
  StageProgress,
  VillagerRelationState,
  VillagerRelationsState
} from '../types/game';
import { VILLAGERS } from './orders';

export const AFFINITY_PER_STAGE: Record<AffinityStage, number> = {
  0: 0,
  1: 20,
  2: 60,
  3: 120,
  4: 200,
  5: 300
};

export const STAGE_NAMES: Record<AffinityStage, string> = {
  0: '陌生人',
  1: '初识',
  2: '熟人',
  3: '好友',
  4: '挚友',
  5: '知己'
};

export const STAGE_COLORS: Record<AffinityStage, string> = {
  0: '#9e9e9e',
  1: '#8bc34a',
  2: '#4caf50',
  3: '#2196f3',
  4: '#9c27b0',
  5: '#ff9800'
};

export const AFFINITY_GAIN = {
  order_completed_common: 3,
  order_completed_rare: 6,
  order_completed_epic: 10,
  order_completed_legendary: 15,
  exclusive_order_completed: 20,
  dialogue_choice_good: 5,
  dialogue_choice_neutral: 2,
  dialogue_choice_bad: -3,
  gift_liked: 8,
  gift_normal: 3,
  gift_disliked: -5
};

export const VILLAGER_DETAILS: Record<string, VillagerDetail> = {
  villager_1: {
    id: 'villager_1',
    name: '李大叔',
    avatar: '👴',
    personality: '勤劳朴实',
    backstory: '在村子里种了一辈子地的老农夫，对农业有着丰富的经验。虽然话不多，但总是乐意帮助新来的农户。',
    likes: ['萝卜', '土豆'],
    dislikes: ['南瓜'],
    birthday: '春3日',
    occupation: '老农夫',
    favoriteItems: ['turnip_product', 'potato_product'],
    hatedItems: ['pumpkin_product']
  },
  villager_2: {
    id: 'villager_2',
    name: '王奶奶',
    avatar: '👵',
    personality: '慈祥温暖',
    backstory: '村子里最年长的老人，擅长做各种糕点。她的厨房总是飘着诱人的香气，孩子们都喜欢去她家玩。',
    likes: ['草莓', '牛奶'],
    dislikes: ['玉米'],
    birthday: '秋12日',
    occupation: '糕点师傅',
    favoriteItems: ['strawberry_product', 'milk'],
    hatedItems: ['corn_product']
  },
  villager_3: {
    id: 'villager_3',
    name: '张小妹',
    avatar: '👧',
    personality: '活泼开朗',
    backstory: '刚从城里读完书回到村子的年轻女孩，梦想着用现代知识让村子变得更好。特别喜欢新鲜事物。',
    likes: ['草莓', '番茄'],
    dislikes: ['萝卜'],
    birthday: '夏5日',
    occupation: '大学毕业生',
    favoriteItems: ['strawberry_product', 'tomato_product'],
    hatedItems: ['turnip_product']
  },
  villager_4: {
    id: 'villager_4',
    name: '陈大哥',
    avatar: '👨',
    personality: '豪爽正直',
    backstory: '村子里的木匠，手艺精湛。他做的家具结实耐用，附近的村民都找他定做。性格豪爽，喜欢交朋友。',
    likes: ['玉米', '南瓜'],
    dislikes: ['草莓'],
    birthday: '冬20日',
    occupation: '木匠',
    favoriteItems: ['corn_product', 'pumpkin_product'],
    hatedItems: ['strawberry_product']
  },
  villager_5: {
    id: 'villager_5',
    name: '刘阿姨',
    avatar: '👩',
    personality: '热情周到',
    backstory: '村子里小卖部的老板娘，消息灵通。谁家有什么事她都知道，是村子里的"情报中心"。',
    likes: ['番茄', '鸡蛋'],
    dislikes: ['土豆'],
    birthday: '春22日',
    occupation: '小卖部老板',
    favoriteItems: ['tomato_product', 'egg'],
    hatedItems: ['potato_product']
  },
  villager_6: {
    id: 'villager_6',
    name: '赵爷爷',
    avatar: '🧓',
    personality: '博学睿智',
    backstory: '退休的老教授，年轻时是植物学家。退休后回到家乡研究农作物，经常给村民们提供种植建议。',
    likes: ['所有稀有作物'],
    dislikes: ['浪费食物'],
    birthday: '冬8日',
    occupation: '退休教授',
    favoriteItems: ['pumpkin_product', 'strawberry_product'],
    hatedItems: []
  },
  villager_7: {
    id: 'villager_7',
    name: '孙小美',
    avatar: '👱‍♀️',
    personality: '温柔善良',
    backstory: '村子里的兽医，同时也照顾着附近的流浪动物。她对每一只动物都充满爱心，是动物们最好的朋友。',
    likes: ['牛奶', '鸡蛋'],
    dislikes: ['虐待动物'],
    birthday: '夏18日',
    occupation: '兽医',
    favoriteItems: ['milk', 'egg'],
    hatedItems: []
  },
  villager_8: {
    id: 'villager_8',
    name: '周老板',
    avatar: '🧔',
    personality: '精明干练',
    backstory: '从城里来的商人，在村里开了收购站。他眼光独到，总能发现优质农产品的价值，出价也公道。',
    likes: ['高质量作物'],
    dislikes: ['劣质品'],
    birthday: '秋30日',
    occupation: '收购商',
    favoriteItems: ['pumpkin_product', 'corn_product', 'tomato_product'],
    hatedItems: []
  }
};

function generateDialoguesForVillager1(): DialogueNode[] {
  const vid = 'villager_1';
  return [
    { id: `${vid}_s0_1`, stage: 0, speaker: 'narrator', text: '你在田埂上遇到了李大叔，他正在仔细地检查自己的田地。', autoNext: `${vid}_s0_2` },
    { id: `${vid}_s0_2`, stage: 0, speaker: 'villager', text: '哦？你就是新来的农户吧？这田地啊，得用心伺候才行。', autoNext: `${vid}_s0_3` },
    { id: `${vid}_s0_3`, stage: 0, speaker: 'villager', text: '我种了一辈子地，有什么不懂的就来问我吧。', choices: [
      { text: '多谢李大叔，我一定好好学习！', affinityDelta: 5, nextNodeId: `${vid}_s0_end` },
      { text: '种地嘛，随便种种就好了。', affinityDelta: -3, nextNodeId: `${vid}_s0_bad` },
      { text: '您能教我怎么种萝卜吗？', affinityDelta: 2, nextNodeId: `${vid}_s0_end` }
    ]},
    { id: `${vid}_s0_bad`, stage: 0, speaker: 'villager', text: '哼，年轻人啊... 种地可不能随便。', autoNext: `${vid}_s0_end` },
    { id: `${vid}_s0_end`, stage: 0, speaker: 'narrator', text: '你与李大叔的第一次交谈结束了。', isEnding: true },

    { id: `${vid}_s1_1`, stage: 1, speaker: 'narrator', text: '李大叔老远就看到了你，向你挥了挥手。', autoNext: `${vid}_s1_2` },
    { id: `${vid}_s1_2`, stage: 1, speaker: 'villager', text: '最近怎么样？地里的作物长得还好吧？', choices: [
      { text: '托您的福，长得很好！', affinityDelta: 5, nextNodeId: `${vid}_s1_good`, unlockRewardId: `${vid}_s1_r1` },
      { text: '还行吧，一般般。', affinityDelta: 2, nextNodeId: `${vid}_s1_end` },
      { text: '好多虫子，烦死了。', affinityDelta: 0, nextNodeId: `${vid}_s1_end` }
    ]},
    { id: `${vid}_s1_good`, stage: 1, speaker: 'villager', text: '哈哈，不错不错！看来你是块种地的料。来，这些种子你拿去试试。', autoNext: `${vid}_s1_end`, unlockOrderId: `${vid}_ex_1` },
    { id: `${vid}_s1_end`, stage: 1, speaker: 'narrator', text: '李大叔继续去忙自己的农活了。', isEnding: true },

    { id: `${vid}_s2_1`, stage: 2, speaker: 'narrator', text: '李大叔坐在田边的老槐树下休息，看到你来了，拍了拍身边的位置。', autoNext: `${vid}_s2_2` },
    { id: `${vid}_s2_2`, stage: 2, speaker: 'villager', text: '来，坐这儿歇会儿。我给你讲讲我年轻时的事儿...', autoNext: `${vid}_s2_3` },
    { id: `${vid}_s2_3`, stage: 2, speaker: 'villager', text: '那时候我比你还年轻，一心想着种出村子里最好的萝卜...', choices: [
      { text: '（认真地听）后来呢？', affinityDelta: 5, nextNodeId: `${vid}_s2_good` },
      { text: '（点头微笑）', affinityDelta: 3, nextNodeId: `${vid}_s2_end` },
      { text: '不好意思，我还有事...', affinityDelta: -2, nextNodeId: `${vid}_s2_end` }
    ]},
    { id: `${vid}_s2_good`, stage: 2, speaker: 'villager', text: '你这孩子不错，肯听老人说话。我有个老朋友，他一直想要一批好土豆，你能帮我完成这个心愿吗？', autoNext: `${vid}_s2_end`, unlockOrderId: `${vid}_ex_2`, unlockRewardId: `${vid}_s2_r1` },
    { id: `${vid}_s2_end`, stage: 2, speaker: 'narrator', text: '李大叔的故事让你对这片土地有了更深的了解。', isEnding: true },

    { id: `${vid}_s3_1`, stage: 3, speaker: 'narrator', text: '李大叔正在院子里整理农具，看到你来了，脸上露出欣慰的笑容。', autoNext: `${vid}_s3_2` },
    { id: `${vid}_s3_2`, stage: 3, speaker: 'villager', text: '孩子，你的农场经营得越来越好了。我都看在眼里。', autoNext: `${vid}_s3_3` },
    { id: `${vid}_s3_3`, stage: 3, speaker: 'villager', text: '我这把老骨头，怕是没几年能种了。但是看到你这样的年轻人...', choices: [
      { text: '李大叔您身体硬朗着呢！', affinityDelta: 5, nextNodeId: `${vid}_s3_good` },
      { text: '我会努力不辜负您的期望。', affinityDelta: 5, nextNodeId: `${vid}_s3_good` },
      { text: '种地确实挺累的。', affinityDelta: -1, nextNodeId: `${vid}_s3_end` }
    ]},
    { id: `${vid}_s3_good`, stage: 3, speaker: 'villager', text: '好！好！来，这是我珍藏的稀有种子，只有真正懂种地的人才配拥有。还有一个重要的委托，你一定要帮我完成！', autoNext: `${vid}_s3_end`, unlockOrderId: `${vid}_ex_3`, unlockRewardId: `${vid}_s3_r1` },
    { id: `${vid}_s3_end`, stage: 3, speaker: 'narrator', text: '李大叔的眼神中充满了期待与信任。', isEnding: true, triggerCodexId: `villager_${vid}_story` },

    { id: `${vid}_s4_1`, stage: 4, speaker: 'narrator', text: '这是一个温暖的傍晚，李大叔邀请你到他家吃晚饭。', autoNext: `${vid}_s4_2` },
    { id: `${vid}_s4_2`, stage: 4, speaker: 'villager', text: '尝尝你李大婶做的菜，她手艺可比我好多了。', autoNext: `${vid}_s4_3` },
    { id: `${vid}_s4_3`, stage: 4, speaker: 'narrator', text: '饭桌上摆满了丰盛的家常菜，就像家一样温暖。', choices: [
      { text: '真好吃！谢谢你们的招待！', affinityDelta: 8, nextNodeId: `${vid}_s4_good` },
      { text: '（大口吃饭，赞不绝口）', affinityDelta: 6, nextNodeId: `${vid}_s4_good` },
      { text: '还可以吧。', affinityDelta: -3, nextNodeId: `${vid}_s4_end` }
    ]},
    { id: `${vid}_s4_good`, stage: 4, speaker: 'villager', text: '哈哈，喜欢就常来！对了，镇上的餐馆老板托我找一批特等品质的蔬菜，只有你能做到了。', autoNext: `${vid}_s4_end`, unlockOrderId: `${vid}_ex_4`, unlockRewardId: `${vid}_s4_r1` },
    { id: `${vid}_s4_end`, stage: 4, speaker: 'narrator', text: '这个晚上，你感受到了家人般的温暖。', isEnding: true },

    { id: `${vid}_s5_1`, stage: 5, speaker: 'narrator', text: '在收获节上，李大叔当着全村人的面走向你。', autoNext: `${vid}_s5_2` },
    { id: `${vid}_s5_2`, stage: 5, speaker: 'villager', text: '各位父老乡亲！今天我要宣布一件事——', autoNext: `${vid}_s5_3` },
    { id: `${vid}_s5_3`, stage: 5, speaker: 'villager', text: '我正式将我耕作了五十年的这块"福田"，交给这位年轻人！', autoNext: `${vid}_s5_4` },
    { id: `${vid}_s5_4`, stage: 5, speaker: 'narrator', text: '全场响起热烈的掌声，李大叔将一把铜钥匙交到你手中。', choices: [
      { text: '李大叔！我...我一定不辜负您！', affinityDelta: 10, nextNodeId: `${vid}_s5_good`, unlockRewardId: `${vid}_s5_r1` },
      { text: '（热泪盈眶，紧紧握住钥匙）', affinityDelta: 10, nextNodeId: `${vid}_s5_good`, unlockRewardId: `${vid}_s5_r1` }
    ]},
    { id: `${vid}_s5_good`, stage: 5, speaker: 'villager', text: '孩子，土地是不会骗人的。你对它用心，它就会给你最好的回报。去吧，去创造属于你的传奇！', autoNext: `${vid}_s5_end`, unlockOrderId: `${vid}_ex_5`, triggerAchievementId: 'soulmate' },
    { id: `${vid}_s5_end`, stage: 5, speaker: 'narrator', text: '你与李大叔的故事，成为了村里流传的佳话。这份情谊，将永远铭刻在心中。', isEnding: true }
  ];
}

function generateDialoguesForVillager2(): DialogueNode[] {
  const vid = 'villager_2';
  return [
    { id: `${vid}_s0_1`, stage: 0, speaker: 'narrator', text: '你路过一间小房子，闻到了诱人的香味。', autoNext: `${vid}_s0_2` },
    { id: `${vid}_s0_2`, stage: 0, speaker: 'villager', text: '哎哟，有客人！快进来快进来，尝尝奶奶刚做的草莓派。', autoNext: `${vid}_s0_3` },
    { id: `${vid}_s0_3`, stage: 0, speaker: 'villager', text: '我叫王奶奶，村里人都爱吃我做的点心呢。', choices: [
      { text: '好香啊！谢谢王奶奶！', affinityDelta: 5, nextNodeId: `${vid}_s0_good` },
      { text: '我就不进去了，谢谢。', affinityDelta: 0, nextNodeId: `${vid}_s0_end` },
      { text: '（直接走进屋里）', affinityDelta: 3, nextNodeId: `${vid}_s0_good` }
    ]},
    { id: `${vid}_s0_good`, stage: 0, speaker: 'villager', text: '真是个有礼貌的好孩子！以后常来玩啊！', autoNext: `${vid}_s0_end` },
    { id: `${vid}_s0_end`, stage: 0, speaker: 'narrator', text: '你与王奶奶的第一次见面，充满了甜蜜的味道。', isEnding: true },

    { id: `${vid}_s1_1`, stage: 1, speaker: 'villager', text: '是你呀孩子，最近怎么样？有没有好好吃饭？', autoNext: `${vid}_s1_2` },
    { id: `${vid}_s1_2`, stage: 1, speaker: 'villager', text: '年轻人可不能因为忙就不吃早饭哦。', choices: [
      { text: '谢谢王奶奶关心，我吃得很好！', affinityDelta: 5, nextNodeId: `${vid}_s1_good`, unlockRewardId: `${vid}_s1_r1` },
      { text: '确实有时候忙忘了...', affinityDelta: 2, nextNodeId: `${vid}_s1_end` },
      { text: '农活太忙了，顾不上。', affinityDelta: -1, nextNodeId: `${vid}_s1_end` }
    ]},
    { id: `${vid}_s1_good`, stage: 1, speaker: 'villager', text: '那就好那就好！对了，奶奶需要一些新鲜草莓做点心，你能帮我种一些吗？', autoNext: `${vid}_s1_end`, unlockOrderId: `${vid}_ex_1` },
    { id: `${vid}_s1_end`, stage: 1, speaker: 'narrator', text: '王奶奶慈祥的笑容让你心里暖暖的。', isEnding: true },

    { id: `${vid}_s2_1`, stage: 2, speaker: 'narrator', text: '王奶奶正在院子里晒被子，看到你来了非常开心。', autoNext: `${vid}_s2_2` },
    { id: `${vid}_s2_2`, stage: 2, speaker: 'villager', text: '孩子你来了！正好，我想给村里的孩子们做一些南瓜饼干...', choices: [
      { text: '需要我帮忙吗？', affinityDelta: 5, nextNodeId: `${vid}_s2_good` },
      { text: '（主动帮忙收拾院子）', affinityDelta: 6, nextNodeId: `${vid}_s2_good` },
      { text: '您做的饼干一定很好吃！', affinityDelta: 3, nextNodeId: `${vid}_s2_end` }
    ]},
    { id: `${vid}_s2_good`, stage: 2, speaker: 'villager', text: '你真是个好孩子！如果你能给我送几个优质南瓜来，奶奶给你做最好吃的饼干！', autoNext: `${vid}_s2_end`, unlockOrderId: `${vid}_ex_2`, unlockRewardId: `${vid}_s2_r1` },
    { id: `${vid}_s2_end`, stage: 2, speaker: 'narrator', text: '你仿佛已经闻到了南瓜饼干的香味。', isEnding: true },

    { id: `${vid}_s3_1`, stage: 3, speaker: 'narrator', text: '王奶奶一个人坐在窗边，似乎在回忆着什么。', autoNext: `${vid}_s3_2` },
    { id: `${vid}_s3_2`, stage: 3, speaker: 'villager', text: '孩子...你来了啊。我正在想我那早逝的老伴...', autoNext: `${vid}_s3_3` },
    { id: `${vid}_s3_3`, stage: 3, speaker: 'villager', text: '他最喜欢吃我做的草莓蛋糕了...', choices: [
      { text: '（静静坐下，陪王奶奶）', affinityDelta: 8, nextNodeId: `${vid}_s3_good` },
      { text: '王爷爷一定是个很好的人。', affinityDelta: 6, nextNodeId: `${vid}_s3_good` },
      { text: '我有事，先走了。', affinityDelta: -5, nextNodeId: `${vid}_s3_end` }
    ]},
    { id: `${vid}_s3_good`, stage: 3, speaker: 'villager', text: '谢谢你，好孩子。今年的收获节，我想给全村人做一个大蛋糕。你能帮我准备材料吗？', autoNext: `${vid}_s3_end`, unlockOrderId: `${vid}_ex_3`, unlockRewardId: `${vid}_s3_r1`, triggerCodexId: `villager_${vid}_story` },
    { id: `${vid}_s3_end`, stage: 3, speaker: 'narrator', text: '有时候，陪伴就是最好的礼物。', isEnding: true },

    { id: `${vid}_s4_1`, stage: 4, speaker: 'narrator', text: '王奶奶正在教几个孩子做点心，看到你来了，招手让你也加入。', autoNext: `${vid}_s4_2` },
    { id: `${vid}_s4_2`, stage: 4, speaker: 'villager', text: '来来来，今天教大家做玉米浓汤！你也一起来学！', autoNext: `${vid}_s4_3` },
    { id: `${vid}_s4_3`, stage: 4, speaker: 'narrator', text: '欢乐的笑声充满了整个屋子。', choices: [
      { text: '（认真学习做汤）', affinityDelta: 8, nextNodeId: `${vid}_s4_good` },
      { text: '（和孩子们一起玩耍）', affinityDelta: 6, nextNodeId: `${vid}_s4_good` },
      { text: '我就看看就好。', affinityDelta: 2, nextNodeId: `${vid}_s4_end` }
    ]},
    { id: `${vid}_s4_good`, stage: 4, speaker: 'villager', text: '哈哈，你学得有模有样！对了，城里的茶餐厅想找我做一批点心，需要最好的原材料，你能帮我完成吗？', autoNext: `${vid}_s4_end`, unlockOrderId: `${vid}_ex_4`, unlockRewardId: `${vid}_s4_r1` },
    { id: `${vid}_s4_end`, stage: 4, speaker: 'narrator', text: '在王奶奶这里，你总能找到家的感觉。', isEnding: true },

    { id: `${vid}_s5_1`, stage: 5, speaker: 'narrator', text: '一个晴朗的午后，王奶奶把你叫到她的储物间。', autoNext: `${vid}_s5_2` },
    { id: `${vid}_s5_2`, stage: 5, speaker: 'villager', text: '孩子，奶奶年纪大了，有些东西...是时候交给你了。', autoNext: `${vid}_s5_3` },
    { id: `${vid}_s5_3`, stage: 5, speaker: 'narrator', text: '王奶奶拿出一本泛黄的食谱，封面上写着"王家世代秘传"。', choices: [
      { text: '王奶奶！这太贵重了...', affinityDelta: 10, nextNodeId: `${vid}_s5_good`, unlockRewardId: `${vid}_s5_r1` },
      { text: '（恭敬地接过食谱）', affinityDelta: 10, nextNodeId: `${vid}_s5_good`, unlockRewardId: `${vid}_s5_r1` }
    ]},
    { id: `${vid}_s5_good`, stage: 5, speaker: 'villager', text: '这是我王家三代人的心血。我没有后代，你就是我的亲孙子（孙女）。希望你能用它，给更多人带来幸福。', autoNext: `${vid}_s5_end`, unlockOrderId: `${vid}_ex_5`, triggerAchievementId: 'soulmate' },
    { id: `${vid}_s5_end`, stage: 5, speaker: 'narrator', text: '你手捧着沉甸甸的食谱，也接过了一份温暖的传承。', isEnding: true }
  ];
}

function generateDialoguesForVillager3(): DialogueNode[] {
  const vid = 'villager_3';
  return [
    { id: `${vid}_s0_1`, stage: 0, speaker: 'narrator', text: '一个背着双肩包的年轻女孩正在打量你的农场。', autoNext: `${vid}_s0_2` },
    { id: `${vid}_s0_2`, stage: 0, speaker: 'villager', text: '哇！这里就是农场吗？好厉害！我是张小妹，刚从城里回来！', autoNext: `${vid}_s0_3` },
    { id: `${vid}_s0_3`, stage: 0, speaker: 'villager', text: '我在大学学的是农业科技，说不定我们可以交流一下！', choices: [
      { text: '欢迎！有新技术一定要告诉我！', affinityDelta: 5, nextNodeId: `${vid}_s0_good` },
      { text: '传统方法可能更可靠吧。', affinityDelta: 0, nextNodeId: `${vid}_s0_end` },
      { text: '大学生啊，真厉害！', affinityDelta: 3, nextNodeId: `${vid}_s0_good` }
    ]},
    { id: `${vid}_s0_good`, stage: 0, speaker: 'villager', text: '嘿嘿，那我们以后就是朋友啦！有什么农业问题随时找我！', autoNext: `${vid}_s0_end` },
    { id: `${vid}_s0_end`, stage: 0, speaker: 'narrator', text: '张小妹的活力让你对未来充满干劲。', isEnding: true },

    { id: `${vid}_s1_1`, stage: 1, speaker: 'villager', text: '嗨！你最近种了什么？我在研究大棚种植的数据，需要一些样本！', choices: [
      { text: '没问题，你随时可以来取样！', affinityDelta: 5, nextNodeId: `${vid}_s1_good`, unlockRewardId: `${vid}_s1_r1` },
      { text: '我的作物数据，有什么用吗？', affinityDelta: 2, nextNodeId: `${vid}_s1_end` },
      { text: '忙完这阵子再说吧。', affinityDelta: -1, nextNodeId: `${vid}_s1_end` }
    ]},
    { id: `${vid}_s1_good`, stage: 1, speaker: 'villager', text: '太棒了！对了，我实验室正好需要一批新鲜番茄做实验，你能帮我种出来吗？', autoNext: `${vid}_s1_end`, unlockOrderId: `${vid}_ex_1` },
    { id: `${vid}_s1_end`, stage: 1, speaker: 'narrator', text: '张小妹眼里闪着对科学的热爱。', isEnding: true },

    { id: `${vid}_s2_1`, stage: 2, speaker: 'narrator', text: '张小妹正在笔记本电脑前忙碌，屏幕上是复杂的数据分析图表。', autoNext: `${vid}_s2_2` },
    { id: `${vid}_s2_2`, stage: 2, speaker: 'villager', text: '你来了！看这个——我分析了土壤数据，发现你的地非常适合种植高附加值作物！', choices: [
      { text: '真的吗？快给我讲讲！', affinityDelta: 6, nextNodeId: `${vid}_s2_good` },
      { text: '高科技啊，我能学会吗？', affinityDelta: 4, nextNodeId: `${vid}_s2_good` },
      { text: '数据什么的，太复杂了。', affinityDelta: -2, nextNodeId: `${vid}_s2_end` }
    ]},
    { id: `${vid}_s2_good`, stage: 2, speaker: 'villager', text: '那是！我给你定制了一个专属种植方案！只要按照这个做，产量肯定翻倍！不过我需要一些优质草莓来验证我的理论。', autoNext: `${vid}_s2_end`, unlockOrderId: `${vid}_ex_2`, unlockRewardId: `${vid}_s2_r1` },
    { id: `${vid}_s2_end`, stage: 2, speaker: 'narrator', text: '你开始觉得，科学种田确实很有意思。', isEnding: true },

    { id: `${vid}_s3_1`, stage: 3, speaker: 'narrator', text: '夕阳下，张小妹坐在田埂上，望着远方出神。', autoNext: `${vid}_s3_2` },
    { id: `${vid}_s3_2`, stage: 3, speaker: 'villager', text: '你知道吗...当初我回村的时候，大家都觉得我疯了...', autoNext: `${vid}_s3_3` },
    { id: `${vid}_s3_3`, stage: 3, speaker: 'villager', text: '"好好的城里工作不做，回乡下种地？"...他们都这么说。', choices: [
      { text: '我支持你，农村需要像你这样的人才！', affinityDelta: 8, nextNodeId: `${vid}_s3_good` },
      { text: '（坐在她身边，静静倾听）', affinityDelta: 8, nextNodeId: `${vid}_s3_good` },
      { text: '城里确实机会更多...', affinityDelta: -3, nextNodeId: `${vid}_s3_end` }
    ]},
    { id: `${vid}_s3_good`, stage: 3, speaker: 'villager', text: '谢谢你...真的。有你这样的朋友，我觉得一切都值得了。对了，我的毕业论文需要一批高品质的稀有作物，你能帮我吗？', autoNext: `${vid}_s3_end`, unlockOrderId: `${vid}_ex_3`, unlockRewardId: `${vid}_s3_r1`, triggerCodexId: `villager_${vid}_story` },
    { id: `${vid}_s3_end`, stage: 3, speaker: 'narrator', text: '两颗为梦想跳动的心，此刻更加靠近了。', isEnding: true },

    { id: `${vid}_s4_1`, stage: 4, speaker: 'narrator', text: '张小妹兴奋地跑来找你，手里挥舞着一封信。', autoNext: `${vid}_s4_2` },
    { id: `${vid}_s4_2`, stage: 4, speaker: 'villager', text: '快看快看！我的论文被农业科学杂志录用了！', autoNext: `${vid}_s4_3` },
    { id: `${vid}_s4_3`, stage: 4, speaker: 'villager', text: '这其中有你好大的功劳呢！', choices: [
      { text: '恭喜你！这是你应得的！', affinityDelta: 8, nextNodeId: `${vid}_s4_good` },
      { text: '太棒了！我们庆祝一下！', affinityDelta: 8, nextNodeId: `${vid}_s4_good` },
      { text: '不错不错，继续加油。', affinityDelta: 3, nextNodeId: `${vid}_s4_end` }
    ]},
    { id: `${vid}_s4_good`, stage: 4, speaker: 'villager', text: '嘿嘿！教授也看到了这篇论文，他想让我提供更多样本！这次需要最高品质的各类农产品，全靠你了！', autoNext: `${vid}_s4_end`, unlockOrderId: `${vid}_ex_4`, unlockRewardId: `${vid}_s4_r1` },
    { id: `${vid}_s4_end`, stage: 4, speaker: 'narrator', text: '梦想的种子已经发芽，正在茁壮成长。', isEnding: true },

    { id: `${vid}_s5_1`, stage: 5, speaker: 'narrator', text: '在全县农业创新大会上，张小妹站在领奖台上。', autoNext: `${vid}_s5_2` },
    { id: `${vid}_s5_2`, stage: 5, speaker: 'villager', text: '各位，这份荣誉不是我一个人的！', autoNext: `${vid}_s5_3` },
    { id: `${vid}_s5_3`, stage: 5, speaker: 'villager', text: '我要把这个奖，献给最懂这片土地、最支持我的伙伴——请上台！', choices: [
      { text: '（坚定地走上台）', affinityDelta: 10, nextNodeId: `${vid}_s5_good`, unlockRewardId: `${vid}_s5_r1` },
      { text: '（在掌声中与她并肩而立）', affinityDelta: 10, nextNodeId: `${vid}_s5_good`, unlockRewardId: `${vid}_s5_r1` }
    ]},
    { id: `${vid}_s5_good`, stage: 5, speaker: 'villager', text: '从今以后，让我们一起用科学的力量，让家乡变得更好！这是我为我们的合作定制的"未来农场"计划，一起实现它吧！', autoNext: `${vid}_s5_end`, unlockOrderId: `${vid}_ex_5`, triggerAchievementId: 'soulmate' },
    { id: `${vid}_s5_end`, stage: 5, speaker: 'narrator', text: '在共同的梦想面前，你们成为了最默契的搭档。未来的路，将一起走下去。', isEnding: true }
  ];
}

function generateBasicDialogues(vid: string, personality: string): DialogueNode[] {
  return [
    { id: `${vid}_s0_1`, stage: 0, speaker: 'narrator', text: `你遇到了${VILLAGERS.find(v => v.id === vid)?.name || '一位村民'}，他/她正在忙碌着。`, autoNext: `${vid}_s0_2` },
    { id: `${vid}_s0_2`, stage: 0, speaker: 'villager', text: '哦，你就是新来的农户吧？我听说过你。', autoNext: `${vid}_s0_3` },
    { id: `${vid}_s0_3`, stage: 0, speaker: 'villager', text: '希望你能在咱们村子过得开心。', choices: [
      { text: '谢谢！请多关照！', affinityDelta: 5, nextNodeId: `${vid}_s0_end` },
      { text: '嗯，我会努力的。', affinityDelta: 3, nextNodeId: `${vid}_s0_end` },
      { text: '（礼貌地点点头）', affinityDelta: 2, nextNodeId: `${vid}_s0_end` }
    ]},
    { id: `${vid}_s0_end`, stage: 0, speaker: 'narrator', text: '你与这位村民的故事，刚刚开始。', isEnding: true },

    { id: `${vid}_s1_1`, stage: 1, speaker: 'villager', text: '最近你的农场经营得不错啊，大家都在夸你呢。', choices: [
      { text: '过奖了，还在学习中。', affinityDelta: 5, nextNodeId: `${vid}_s1_good`, unlockRewardId: `${vid}_s1_r1` },
      { text: '都是运气好。', affinityDelta: 3, nextNodeId: `${vid}_s1_end` },
      { text: '嘿嘿，那是当然的！', affinityDelta: 1, nextNodeId: `${vid}_s1_end` }
    ]},
    { id: `${vid}_s1_good`, stage: 1, speaker: 'villager', text: '谦虚是好事！对了，我正好有个小委托，你能帮我吗？', autoNext: `${vid}_s1_end`, unlockOrderId: `${vid}_ex_1` },
    { id: `${vid}_s1_end`, stage: 1, speaker: 'narrator', text: '你们的关系更近了一步。', isEnding: true },

    { id: `${vid}_s2_1`, stage: 2, speaker: 'narrator', text: '这位村民今天看起来心情不错。', autoNext: `${vid}_s2_2` },
    { id: `${vid}_s2_2`, stage: 2, speaker: 'villager', text: '来了啊！正好想找你聊聊。', autoNext: `${vid}_s2_3` },
    { id: `${vid}_s2_3`, stage: 2, speaker: 'villager', text: '说起来，认识你之后，我感觉村子都热闹了不少。', choices: [
      { text: '我也很喜欢这里！', affinityDelta: 6, nextNodeId: `${vid}_s2_good` },
      { text: '大家都很友善。', affinityDelta: 5, nextNodeId: `${vid}_s2_good` },
      { text: '还行吧。', affinityDelta: 0, nextNodeId: `${vid}_s2_end` }
    ]},
    { id: `${vid}_s2_good`, stage: 2, speaker: 'villager', text: '哈哈！那我就放心了。对了，有个重要的事情想请你帮忙，这是我一直很想完成的心愿。', autoNext: `${vid}_s2_end`, unlockOrderId: `${vid}_ex_2`, unlockRewardId: `${vid}_s2_r1` },
    { id: `${vid}_s2_end`, stage: 2, speaker: 'narrator', text: '信任，就是这样一点一滴建立起来的。', isEnding: true },

    { id: `${vid}_s3_1`, stage: 3, speaker: 'narrator', text: '你们的关系已经相当要好了。', autoNext: `${vid}_s3_2` },
    { id: `${vid}_s3_2`, stage: 3, speaker: 'villager', text: '你知道吗？我很少对别人说这些话...', autoNext: `${vid}_s3_3` },
    { id: `${vid}_s3_3`, stage: 3, speaker: 'villager', text: '但是你，让我觉得可以敞开心扉。', choices: [
      { text: '我也是，你是我重要的朋友。', affinityDelta: 8, nextNodeId: `${vid}_s3_good` },
      { text: '（认真地点头）我会珍惜这份友谊。', affinityDelta: 8, nextNodeId: `${vid}_s3_good` },
      { text: '（有些害羞）谢谢。', affinityDelta: 5, nextNodeId: `${vid}_s3_end` }
    ]},
    { id: `${vid}_s3_good`, stage: 3, speaker: 'villager', text: '有你这句话就够了！这是我珍藏多年的东西，现在交给你！还有一件只有你才能完成的事...', autoNext: `${vid}_s3_end`, unlockOrderId: `${vid}_ex_3`, unlockRewardId: `${vid}_s3_r1`, triggerCodexId: `villager_${vid}_story` },
    { id: `${vid}_s3_end`, stage: 3, speaker: 'narrator', text: '真正的朋友，就是可以相互信任的人。', isEnding: true },

    { id: `${vid}_s4_1`, stage: 4, speaker: 'narrator', text: '你们已经是无话不谈的挚友了。', autoNext: `${vid}_s4_2` },
    { id: `${vid}_s4_2`, stage: 4, speaker: 'villager', text: '你知道吗？认识你，是我这几年最开心的事。', autoNext: `${vid}_s4_3` },
    { id: `${vid}_s4_3`, stage: 4, speaker: 'villager', text: '如果没有你，我可能永远迈不出那一步。', choices: [
      { text: '我也是，你改变了我很多。', affinityDelta: 10, nextNodeId: `${vid}_s4_good` },
      { text: '我们互相成就了对方。', affinityDelta: 10, nextNodeId: `${vid}_s4_good` },
      { text: '别这么说，你自己也很努力。', affinityDelta: 5, nextNodeId: `${vid}_s4_end` }
    ]},
    { id: `${vid}_s4_good`, stage: 4, speaker: 'villager', text: '那么，陪我完成最后这个梦想吧！这是我人生中最大的愿望，完成它我就没有遗憾了！', autoNext: `${vid}_s4_end`, unlockOrderId: `${vid}_ex_4`, unlockRewardId: `${vid}_s4_r1` },
    { id: `${vid}_s4_end`, stage: 4, speaker: 'narrator', text: '挚友的意义，在于彼此成就，共同成长。', isEnding: true },

    { id: `${vid}_s5_1`, stage: 5, speaker: 'narrator', text: '这是一个值得纪念的日子。', autoNext: `${vid}_s5_2` },
    { id: `${vid}_s5_2`, stage: 5, speaker: 'villager', text: '人生难得一知己...', autoNext: `${vid}_s5_3` },
    { id: `${vid}_s5_3`, stage: 5, speaker: 'villager', text: '谢谢你，出现在我的生命里。', choices: [
      { text: '（紧紧握住对方的手）我也是。', affinityDelta: 10, nextNodeId: `${vid}_s5_good`, unlockRewardId: `${vid}_s5_r1` },
      { text: '（眼眶湿润）谢谢你。', affinityDelta: 10, nextNodeId: `${vid}_s5_good`, unlockRewardId: `${vid}_s5_r1` }
    ]},
    { id: `${vid}_s5_good`, stage: 5, speaker: 'villager', text: '这是我最珍贵的东西，现在它属于你了。无论发生什么，我们永远都是最好的朋友！', autoNext: `${vid}_s5_end`, unlockOrderId: `${vid}_ex_5`, triggerAchievementId: 'soulmate' },
    { id: `${vid}_s5_end`, stage: 5, speaker: 'narrator', text: '人生得一知己，足矣。这份情谊，将伴随你们一生。', isEnding: true }
  ];
}

export const VILLAGER_DIALOGUES: Record<string, DialogueNode[]> = {
  villager_1: generateDialoguesForVillager1(),
  villager_2: generateDialoguesForVillager2(),
  villager_3: generateDialoguesForVillager3(),
  villager_4: generateBasicDialogues('villager_4', '豪爽正直'),
  villager_5: generateBasicDialogues('villager_5', '热情周到'),
  villager_6: generateBasicDialogues('villager_6', '博学睿智'),
  villager_7: generateBasicDialogues('villager_7', '温柔善良'),
  villager_8: generateBasicDialogues('villager_8', '精明干练')
};

export const VILLAGER_EXCLUSIVE_ORDERS: Record<string, ExclusiveOrderTemplate[]> = {
  villager_1: [
    { id: 'villager_1_ex_1', villagerId: 'villager_1', unlockStage: 1, name: '李大叔的胡萝卜田', description: '李大叔想教邻居家的孩子种萝卜，需要一些样品。', items: [{ itemId: 'turnip_product', quantity: 10, minQuality: 2 }], reward: { coins: 500, reputation: 10, rareSeedId: 'turnip_seed', rareSeedQuantity: 5 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'villager_1_ex_2', villagerId: 'villager_1', unlockStage: 2, name: '老友的心愿', description: '李大叔的老朋友想要一批优质土豆，这对他很重要。', items: [{ itemId: 'potato_product', quantity: 15, minQuality: 3 }], reward: { coins: 800, reputation: 20, rareSeedId: 'potato_seed', rareSeedQuantity: 8 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'villager_1_ex_3', villagerId: 'villager_1', unlockStage: 3, name: '传家之宝', description: '李大叔想把最好的种子托付给真正懂行的人。先证明你自己吧！', items: [{ itemId: 'turnip_product', quantity: 20, minQuality: 4 }, { itemId: 'potato_product', quantity: 15, minQuality: 4 }], reward: { coins: 1500, reputation: 35, rareSeedId: 'pumpkin_seed', rareSeedQuantity: 5 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'villager_1_ex_4', villagerId: 'villager_1', unlockStage: 4, name: '餐馆的特供', description: '镇上餐馆需要特等品质的蔬菜，李大叔推荐了你。', items: [{ itemId: 'turnip_product', quantity: 25, minQuality: 5 }, { itemId: 'potato_product', quantity: 25, minQuality: 5 }], reward: { coins: 3000, reputation: 50, rareSeedId: 'strawberry_seed', rareSeedQuantity: 8 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 },
    { id: 'villager_1_ex_5', villagerId: 'villager_1', unlockStage: 5, name: '福田的传承', description: '李大叔的"福田"需要最优秀的农夫来证明配得上它。', items: [{ itemId: 'turnip_product', quantity: 30, minQuality: 5 }, { itemId: 'potato_product', quantity: 30, minQuality: 5 }, { itemId: 'pumpkin_product', quantity: 10, minQuality: 5 }], reward: { coins: 8000, reputation: 100, rareSeedId: 'strawberry_seed', rareSeedQuantity: 20 }, deadlineDays: 7, oneTimeOnly: true, priority: 1 }
  ],
  villager_2: [
    { id: 'villager_2_ex_1', villagerId: 'villager_2', unlockStage: 1, name: '草莓派的原料', description: '王奶奶要做美味的草莓派，需要新鲜的草莓。', items: [{ itemId: 'strawberry_product', quantity: 8, minQuality: 2 }], reward: { coins: 600, reputation: 10, rareSeedId: 'strawberry_seed', rareSeedQuantity: 3 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'villager_2_ex_2', villagerId: 'villager_2', unlockStage: 2, name: '南瓜饼干', description: '王奶奶要给孩子们做南瓜饼干。', items: [{ itemId: 'pumpkin_product', quantity: 8, minQuality: 3 }], reward: { coins: 900, reputation: 20, rareSeedId: 'pumpkin_seed', rareSeedQuantity: 5 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'villager_2_ex_3', villagerId: 'villager_2', unlockStage: 3, name: '收获节的大蛋糕', description: '王奶奶要给全村做一个超级大蛋糕！', items: [{ itemId: 'strawberry_product', quantity: 15, minQuality: 4 }, { itemId: 'milk', quantity: 10 }], reward: { coins: 1800, reputation: 35, rareSeedId: 'strawberry_seed', rareSeedQuantity: 6 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'villager_2_ex_4', villagerId: 'villager_2', unlockStage: 4, name: '茶餐厅的大订单', description: '城里的茶餐厅订购了一批特色点心材料。', items: [{ itemId: 'strawberry_product', quantity: 20, minQuality: 5 }, { itemId: 'pumpkin_product', quantity: 10, minQuality: 5 }, { itemId: 'milk', quantity: 15 }], reward: { coins: 3500, reputation: 50, rareSeedId: 'corn_seed', rareSeedQuantity: 8 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 },
    { id: 'villager_2_ex_5', villagerId: 'villager_2', unlockStage: 5, name: '王家秘传食谱', description: '完成这个订单，你就配得上王家的传承食谱了。', items: [{ itemId: 'strawberry_product', quantity: 25, minQuality: 5 }, { itemId: 'pumpkin_product', quantity: 25, minQuality: 5 }, { itemId: 'milk', quantity: 20, minQuality: 4 }], reward: { coins: 8800, reputation: 100, rareSeedId: 'tomato_seed', rareSeedQuantity: 15 }, deadlineDays: 7, oneTimeOnly: true, priority: 1 }
  ],
  villager_3: [
    { id: 'villager_3_ex_1', villagerId: 'villager_3', unlockStage: 1, name: '实验样本', description: '张小妹的实验室需要新鲜番茄样本。', items: [{ itemId: 'tomato_product', quantity: 8, minQuality: 2 }], reward: { coins: 550, reputation: 10, rareSeedId: 'tomato_seed', rareSeedQuantity: 4 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'villager_3_ex_2', villagerId: 'villager_3', unlockStage: 2, name: '数据验证', description: '需要优质草莓验证张小妹的种植理论。', items: [{ itemId: 'strawberry_product', quantity: 12, minQuality: 3 }], reward: { coins: 950, reputation: 20, rareSeedId: 'strawberry_seed', rareSeedQuantity: 5 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'villager_3_ex_3', villagerId: 'villager_3', unlockStage: 3, name: '毕业论文素材', description: '毕业论文需要高品质稀有作物作为论据。', items: [{ itemId: 'tomato_product', quantity: 15, minQuality: 4 }, { itemId: 'strawberry_product', quantity: 12, minQuality: 4 }, { itemId: 'corn_product', quantity: 8, minQuality: 4 }], reward: { coins: 2000, reputation: 35, rareSeedId: 'tomato_seed', rareSeedQuantity: 8 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'villager_3_ex_4', villagerId: 'villager_3', unlockStage: 4, name: '教授的要求', description: '教授需要最高品质的各类农产品继续研究。', items: [{ itemId: 'tomato_product', quantity: 20, minQuality: 5 }, { itemId: 'strawberry_product', quantity: 20, minQuality: 5 }, { itemId: 'corn_product', quantity: 15, minQuality: 5 }], reward: { coins: 4000, reputation: 50, rareSeedId: 'pumpkin_seed', rareSeedQuantity: 10 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 },
    { id: 'villager_3_ex_5', villagerId: 'villager_3', unlockStage: 5, name: '未来农场计划', description: '展示你们合作的最高成果！', items: [{ itemId: 'turnip_product', quantity: 20, minQuality: 5 }, { itemId: 'tomato_product', quantity: 25, minQuality: 5 }, { itemId: 'strawberry_product', quantity: 25, minQuality: 5 }, { itemId: 'corn_product', quantity: 20, minQuality: 5 }], reward: { coins: 9999, reputation: 100, rareSeedId: 'strawberry_seed', rareSeedQuantity: 25 }, deadlineDays: 7, oneTimeOnly: true, priority: 1 }
  ],
  villager_4: [
    { id: 'villager_4_ex_1', villagerId: 'villager_4', unlockStage: 1, name: '新家具的材料', description: '陈大哥需要玉米杆做新家具的材料。', items: [{ itemId: 'corn_product', quantity: 10, minQuality: 2 }], reward: { coins: 520, reputation: 10, rareSeedId: 'corn_seed', rareSeedQuantity: 4 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'villager_4_ex_2', villagerId: 'villager_4', unlockStage: 2, name: '大型家具的报酬', description: '陈大哥完成了一个大单子，请你帮他准备一些东西。', items: [{ itemId: 'pumpkin_product', quantity: 8, minQuality: 3 }, { itemId: 'corn_product', quantity: 8, minQuality: 3 }], reward: { coins: 880, reputation: 20, rareSeedId: 'corn_seed', rareSeedQuantity: 6 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'villager_4_ex_3', villagerId: 'villager_4', unlockStage: 3, name: '村里的祠堂', description: '陈大哥要翻修村里的祠堂，需要大量材料。', items: [{ itemId: 'corn_product', quantity: 20, minQuality: 4 }, { itemId: 'pumpkin_product', quantity: 15, minQuality: 4 }], reward: { coins: 1600, reputation: 35, rareSeedId: 'pumpkin_seed', rareSeedQuantity: 5 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'villager_4_ex_4', villagerId: 'villager_4', unlockStage: 4, name: '城里的大订单', description: '城里的酒店订制了一批高级家具。', items: [{ itemId: 'corn_product', quantity: 25, minQuality: 5 }, { itemId: 'pumpkin_product', quantity: 20, minQuality: 5 }], reward: { coins: 3200, reputation: 50, rareSeedId: 'tomato_seed', rareSeedQuantity: 6 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 },
    { id: 'villager_4_ex_5', villagerId: 'villager_4', unlockStage: 5, name: '传世之作', description: '陈大哥要做一件传世家具，需要最好的材料。', items: [{ itemId: 'corn_product', quantity: 30, minQuality: 5 }, { itemId: 'pumpkin_product', quantity: 25, minQuality: 5 }, { itemId: 'potato_product', quantity: 20, minQuality: 5 }], reward: { coins: 7500, reputation: 100, rareSeedId: 'pumpkin_seed', rareSeedQuantity: 15 }, deadlineDays: 7, oneTimeOnly: true, priority: 1 }
  ],
  villager_5: [
    { id: 'villager_5_ex_1', villagerId: 'villager_5', unlockStage: 1, name: '小卖部进货', description: '刘阿姨的小卖部需要进货了。', items: [{ itemId: 'tomato_product', quantity: 10 }], reward: { coins: 480, reputation: 10, rareSeedId: 'tomato_seed', rareSeedQuantity: 3 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'villager_5_ex_2', villagerId: 'villager_5', unlockStage: 2, name: '热销商品', description: '最近番茄和鸡蛋特别热销。', items: [{ itemId: 'tomato_product', quantity: 12, minQuality: 3 }, { itemId: 'egg', quantity: 10 }], reward: { coins: 820, reputation: 20, rareSeedId: 'tomato_seed', rareSeedQuantity: 5 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'villager_5_ex_3', villagerId: 'villager_5', unlockStage: 3, name: '节日备货', description: '节日快到了，小卖部要备足货。', items: [{ itemId: 'tomato_product', quantity: 15, minQuality: 4 }, { itemId: 'egg', quantity: 15 }, { itemId: 'milk', quantity: 8 }], reward: { coins: 1700, reputation: 35, rareSeedId: 'strawberry_seed', rareSeedQuantity: 4 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'villager_5_ex_4', villagerId: 'villager_5', unlockStage: 4, name: '连锁合作', description: '刘阿姨要和城里的超市合作了！', items: [{ itemId: 'tomato_product', quantity: 20, minQuality: 5 }, { itemId: 'egg', quantity: 25 }, { itemId: 'milk', quantity: 12, minQuality: 4 }], reward: { coins: 3300, reputation: 50, rareSeedId: 'corn_seed', rareSeedQuantity: 6 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 },
    { id: 'villager_5_ex_5', villagerId: 'villager_5', unlockStage: 5, name: '商业帝国的起点', description: '这是刘阿姨梦想中的第一家超市的开业订单。', items: [{ itemId: 'tomato_product', quantity: 25, minQuality: 5 }, { itemId: 'egg', quantity: 30 }, { itemId: 'milk', quantity: 20, minQuality: 4 }, { itemId: 'potato_product', quantity: 20, minQuality: 5 }], reward: { coins: 7800, reputation: 100, rareSeedId: 'tomato_seed', rareSeedQuantity: 18 }, deadlineDays: 7, oneTimeOnly: true, priority: 1 }
  ],
  villager_6: [
    { id: 'villager_6_ex_1', villagerId: 'villager_6', unlockStage: 1, name: '植物研究样本', description: '赵教授需要各种植物样本进行研究。', items: [{ itemId: 'turnip_product', quantity: 5 }, { itemId: 'potato_product', quantity: 5 }], reward: { coins: 550, reputation: 10, rareSeedId: 'turnip_seed', rareSeedQuantity: 5 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'villager_6_ex_2', villagerId: 'villager_6', unlockStage: 2, name: '稀有品种观察', description: '赵教授想观察稀有品种的生长情况。', items: [{ itemId: 'strawberry_product', quantity: 8, minQuality: 3 }, { itemId: 'pumpkin_product', quantity: 8, minQuality: 3 }], reward: { coins: 950, reputation: 20, rareSeedId: 'strawberry_seed', rareSeedQuantity: 5 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'villager_6_ex_3', villagerId: 'villager_6', unlockStage: 3, name: '论文实验数据', description: '赵教授的论文需要大量对比数据。', items: [{ itemId: 'turnip_product', quantity: 10, minQuality: 4 }, { itemId: 'potato_product', quantity: 10, minQuality: 4 }, { itemId: 'strawberry_product', quantity: 10, minQuality: 4 }, { itemId: 'pumpkin_product', quantity: 10, minQuality: 4 }], reward: { coins: 2200, reputation: 35, rareSeedId: 'corn_seed', rareSeedQuantity: 8 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'villager_6_ex_4', villagerId: 'villager_6', unlockStage: 4, name: '顶级学术论文', description: '要冲击顶级期刊，必须用最高品质的样本！', items: [{ itemId: 'strawberry_product', quantity: 20, minQuality: 5 }, { itemId: 'pumpkin_product', quantity: 20, minQuality: 5 }, { itemId: 'corn_product', quantity: 15, minQuality: 5 }], reward: { coins: 4200, reputation: 50, rareSeedId: 'tomato_seed', rareSeedQuantity: 10 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 },
    { id: 'villager_6_ex_5', villagerId: 'villager_6', unlockStage: 5, name: '学术继承人', description: '赵教授决定把毕生研究托付给你，先证明你值得。', items: [{ itemId: 'strawberry_product', quantity: 30, minQuality: 5 }, { itemId: 'pumpkin_product', quantity: 25, minQuality: 5 }, { itemId: 'corn_product', quantity: 25, minQuality: 5 }, { itemId: 'tomato_product', quantity: 25, minQuality: 5 }], reward: { coins: 9000, reputation: 100, rareSeedId: 'strawberry_seed', rareSeedQuantity: 20 }, deadlineDays: 7, oneTimeOnly: true, priority: 1 }
  ],
  villager_7: [
    { id: 'villager_7_ex_1', villagerId: 'villager_7', unlockStage: 1, name: '动物的营养', description: '孙小美需要牛奶和鸡蛋给小动物们补充营养。', items: [{ itemId: 'milk', quantity: 5 }, { itemId: 'egg', quantity: 8 }], reward: { coins: 500, reputation: 10 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'villager_7_ex_2', villagerId: 'villager_7', unlockStage: 2, name: '动物们的零食', description: '小动物们爱吃的南瓜和玉米，你有吗？', items: [{ itemId: 'pumpkin_product', quantity: 8 }, { itemId: 'corn_product', quantity: 10 }], reward: { coins: 860, reputation: 20, rareSeedId: 'pumpkin_seed', rareSeedQuantity: 4 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'villager_7_ex_3', villagerId: 'villager_7', unlockStage: 3, name: '流浪动物救助站', description: '孙小美建立了一个救助站，需要大量物资。', items: [{ itemId: 'milk', quantity: 15 }, { itemId: 'egg', quantity: 20 }, { itemId: 'potato_product', quantity: 15 }], reward: { coins: 1800, reputation: 35, rareSeedId: 'corn_seed', rareSeedQuantity: 5 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'villager_7_ex_4', villagerId: 'villager_7', unlockStage: 4, name: '动物医院的订单', description: '镇上的动物医院需要大量营养食品。', items: [{ itemId: 'milk', quantity: 25, minQuality: 4 }, { itemId: 'egg', quantity: 30, minQuality: 3 }, { itemId: 'strawberry_product', quantity: 15, minQuality: 4 }], reward: { coins: 3600, reputation: 50, rareSeedId: 'strawberry_seed', rareSeedQuantity: 8 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 },
    { id: 'villager_7_ex_5', villagerId: 'villager_7', unlockStage: 5, name: '动物保护协会', description: '全县动物保护协会的超级大订单，这将帮助无数小动物！', items: [{ itemId: 'milk', quantity: 40, minQuality: 5 }, { itemId: 'egg', quantity: 50, minQuality: 4 }, { itemId: 'corn_product', quantity: 25, minQuality: 5 }], reward: { coins: 8500, reputation: 100, rareSeedId: 'corn_seed', rareSeedQuantity: 20 }, deadlineDays: 7, oneTimeOnly: true, priority: 1 }
  ],
  villager_8: [
    { id: 'villager_8_ex_1', villagerId: 'villager_8', unlockStage: 1, name: '试收购', description: '周老板想试试你的农产品品质。', items: [{ itemId: 'potato_product', quantity: 8, minQuality: 2 }, { itemId: 'tomato_product', quantity: 8, minQuality: 2 }], reward: { coins: 600, reputation: 10, rareSeedId: 'potato_seed', rareSeedQuantity: 5 }, deadlineDays: 3, oneTimeOnly: true, priority: 10 },
    { id: 'villager_8_ex_2', villagerId: 'villager_8', unlockStage: 2, name: '优质供应商', description: '周老板要给你一个优质供应商的机会。', items: [{ itemId: 'pumpkin_product', quantity: 10, minQuality: 3 }, { itemId: 'corn_product', quantity: 10, minQuality: 3 }], reward: { coins: 1000, reputation: 20, rareSeedId: 'pumpkin_seed', rareSeedQuantity: 6 }, deadlineDays: 4, oneTimeOnly: true, priority: 9 },
    { id: 'villager_8_ex_3', villagerId: 'villager_8', unlockStage: 3, name: '高端客户', description: '周老板的高端客户需要最好的农产品。', items: [{ itemId: 'tomato_product', quantity: 15, minQuality: 4 }, { itemId: 'pumpkin_product', quantity: 12, minQuality: 4 }, { itemId: 'corn_product', quantity: 12, minQuality: 4 }], reward: { coins: 2100, reputation: 35, rareSeedId: 'tomato_seed', rareSeedQuantity: 8 }, deadlineDays: 5, oneTimeOnly: true, priority: 8 },
    { id: 'villager_8_ex_4', villagerId: 'villager_8', unlockStage: 4, name: '全国连锁店', description: '周老板谈成了全国连锁店的合作！', items: [{ itemId: 'tomato_product', quantity: 20, minQuality: 5 }, { itemId: 'pumpkin_product', quantity: 20, minQuality: 5 }, { itemId: 'corn_product', quantity: 20, minQuality: 5 }], reward: { coins: 4500, reputation: 50, rareSeedId: 'strawberry_seed', rareSeedQuantity: 10 }, deadlineDays: 6, oneTimeOnly: true, priority: 7 },
    { id: 'villager_8_ex_5', villagerId: 'villager_8', unlockStage: 5, name: '商业合伙人', description: '周老板邀请你成为他的商业合伙人！这是终极考验。', items: [{ itemId: 'tomato_product', quantity: 30, minQuality: 5 }, { itemId: 'pumpkin_product', quantity: 30, minQuality: 5 }, { itemId: 'corn_product', quantity: 30, minQuality: 5 }, { itemId: 'strawberry_product', quantity: 20, minQuality: 5 }], reward: { coins: 9500, reputation: 100, rareSeedId: 'strawberry_seed', rareSeedQuantity: 25 }, deadlineDays: 7, oneTimeOnly: true, priority: 1 }
  ]
};

export const STORYLINE_REWARDS: Record<string, StorylineReward> = {};
for (let v = 1; v <= 8; v++) {
  const vid = `villager_${v}`;
  STORYLINE_REWARDS[`${vid}_s1_r1`] = { id: `${vid}_s1_r1`, type: 'coins', amount: 100, description: '初识礼物：100金币' };
  STORYLINE_REWARDS[`${vid}_s2_r1`] = { id: `${vid}_s2_r1`, type: 'reputation', amount: 10, description: '熟人信任：+10声望' };
  STORYLINE_REWARDS[`${vid}_s3_r1`] = { id: `${vid}_s3_r1`, type: 'seed', itemId: 'strawberry_seed', amount: 3, description: '好友馈赠：草莓种子x3' };
  STORYLINE_REWARDS[`${vid}_s4_r1`] = { id: `${vid}_s4_r1`, type: 'seed', itemId: 'pumpkin_seed', amount: 5, description: '挚友信物：南瓜种子x5' };
  STORYLINE_REWARDS[`${vid}_s5_r1`] = { id: `${vid}_s5_r1`, type: 'coins', amount: 2000, description: '知己厚礼：2000金币' };
}

export function getAffinityStage(affinity: number): AffinityStage {
  let stage: AffinityStage = 0;
  const stages: AffinityStage[] = [0, 1, 2, 3, 4, 5];
  for (const s of stages) {
    if (affinity >= AFFINITY_PER_STAGE[s]) {
      stage = s;
    }
  }
  return stage;
}

export function getStageProgress(affinity: number): StageProgress {
  const currentStage = getAffinityStage(affinity);
  const nextStage: AffinityStage = Math.min(5, currentStage + 1) as AffinityStage;
  const currentRequired = AFFINITY_PER_STAGE[currentStage];
  const nextRequired = AFFINITY_PER_STAGE[nextStage];
  const progressInStage = affinity - currentRequired;
  const stageRange = nextRequired - currentRequired;
  const percentage = stageRange > 0 ? Math.min(100, (progressInStage / stageRange) * 100) : 100;
  return { current: progressInStage, required: stageRange, percentage };
}

export function getDialogueMap(dialogues: DialogueNode[]): Map<string, DialogueNode> {
  const map = new Map<string, DialogueNode>();
  for (const node of dialogues) {
    map.set(node.id, node);
  }
  return map;
}

export function getStartDialogueForStage(villagerId: string, stage: AffinityStage): DialogueNode | undefined {
  const dialogues = VILLAGER_DIALOGUES[villagerId] || [];
  return dialogues.find(d => d.stage === stage && d.id.endsWith('_s' + stage + '_1'));
}

export function getExclusiveOrdersForStage(villagerId: string, stage: AffinityStage): ExclusiveOrderTemplate[] {
  const orders = VILLAGER_EXCLUSIVE_ORDERS[villagerId] || [];
  return orders.filter(o => o.unlockStage === stage);
}

export function getExclusiveOrderById(orderId: string): ExclusiveOrderTemplate | undefined {
  for (const orders of Object.values(VILLAGER_EXCLUSIVE_ORDERS)) {
    const found = orders.find(o => o.id === orderId);
    if (found) return found;
  }
  return undefined;
}

export function getRewardById(rewardId: string): StorylineReward | undefined {
  return STORYLINE_REWARDS[rewardId];
}

export function getVillagerDetail(villagerId: string): VillagerDetail | undefined {
  return VILLAGER_DETAILS[villagerId];
}

export function getAllVillagerIds(): string[] {
  return Object.keys(VILLAGER_DETAILS);
}

export function createInitialVillagerRelation(villagerId: string): VillagerRelationState {
  const startDialogue = getStartDialogueForStage(villagerId, 0);
  return {
    villagerId,
    affinity: 0,
    stage: 0,
    currentDialogueId: startDialogue?.id || '',
    completedDialogueIds: [],
    unlockedExclusiveOrderIds: [],
    completedExclusiveOrderIds: [],
    claimedRewardIds: [],
    ordersCompletedFor: 0,
    giftsGiven: 0,
    lastInteractTime: 0,
    storylineCompleted: false
  };
}

export function createInitialVillagerRelations(): VillagerRelationsState {
  const relations: Record<string, VillagerRelationState> = {};
  for (const vid of getAllVillagerIds()) {
    relations[vid] = createInitialVillagerRelation(vid);
  }
  return {
    relations,
    totalAffinity: 0,
    highestStage: 0,
    storylinesCompleted: 0,
    exclusiveOrdersCompleted: 0
  };
}