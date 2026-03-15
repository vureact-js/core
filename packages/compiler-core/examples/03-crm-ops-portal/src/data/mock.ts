export const kpis = [
  { title: '新增线索', value: 128, delta: '+18%', trend: 'up' },
  { title: '活跃客户', value: 64, delta: '+6%', trend: 'up' },
  { title: '本月成交', value: 24, delta: '-4%', trend: 'down' },
  { title: '平均跟进时长', value: '2.4 天', delta: '+0.3 天', trend: 'up' },
];

export const activities = [
  { id: 1, who: '张琳', action: '提交了新线索', target: '云启物流', time: '10:12' },
  { id: 2, who: '李晨', action: '完成需求澄清', target: '信航数据', time: '11:05' },
  { id: 3, who: '王琪', action: '更新了报价', target: '星际制造', time: '13:30' },
];

export const customers = [
  { id: 'C-1001', name: '云启物流', owner: '张琳', status: '活跃', score: 86 },
  { id: 'C-1002', name: '星际制造', owner: '李晨', status: '沉默', score: 62 },
  { id: 'C-1003', name: '信航数据', owner: '王琪', status: '活跃', score: 91 },
  { id: 'C-1004', name: '澄海商贸', owner: '周逸', status: '流失', score: 40 },
];

export const leads = [
  {
    id: 'L-2001',
    name: '智远科技',
    value: 32,
    stage: '新线索',
    owner: '张琳',
  },
  {
    id: 'L-2002',
    name: '焕然医疗',
    value: 48,
    stage: '已接触',
    owner: '李晨',
  },
  {
    id: 'L-2003',
    name: '诚邦制造',
    value: 76,
    stage: '方案评估',
    owner: '王琪',
  },
];

export const tasks = [
  { id: 1, title: '准备方案 demo', owner: '张琳', status: '待开始' },
  { id: 2, title: '回访信航数据', owner: '李晨', status: '进行中' },
  { id: 3, title: '更新合同模板', owner: '王琪', status: '已完成' },
  { id: 4, title: '整理沉默客户清单', owner: '周逸', status: '待开始' },
];

export const stages = [
  { key: '新线索', label: '新线索' },
  { key: '已接触', label: '已接触' },
  { key: '方案评估', label: '方案评估' },
  { key: '谈判中', label: '谈判中' },
];
