import React, { useState, useRef, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Users, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Download, 
  Printer, 
  Search,
  Plus,
  Trash2,
  FileSpreadsheet,
  Stethoscope,
  ClipboardList,
  Info,
  BarChart2
} from 'lucide-react';

// -----------------------------------------------------------------------------
// 1. 檢驗參考值資料庫 (依據使用者提供之台大醫院標準圖片)
// -----------------------------------------------------------------------------
const REF_DATA = {
  // --- 血液一般檢驗 ---
  hb: 'M:13.1-17.2;F:11.0-15.2', // g/dL
  rbc: 'M:4.21-5.9;F:3.78-5.25', // 10^6/uL
  wbc: '3.25-9.16', // 10^3/uL
  plt: '150-378', // 10^3/uL
  hct: 'M:39.6-51.5;F:34.8-46.3', // %
  mcv: '80.9-99.3', // fL
  mch: '25.5-33.2', // pg
  mchc: '31.0-34.9', // g/dL
  esr: 'M:2-10;F:2-15', // mm/hr
  neutrophils: '41.6-74.4', // %
  lymphocytes: '18.0-48.8', // %
  
  // --- 糖尿病檢查 ---
  ac_sugar: '70-100', // mg/dL
  pc_sugar: '<140', // mg/dL (飯後)
  hba1c: '4.0-6.0', // %
  insulin: '<28.8', // uU/mL
  c_peptide: '0.78-5.19', // ng/mL
  
  // --- 腎功能 / 尿液 (一般+特殊) ---
  bun: '7-25', // mg/dL
  cre: '0.6-1.3', // mg/dL
  ua: 'M:4.4-7.6;F:2.3-6.6', // mg/dL
  urine_ph: '5.0-8.0',
  urine_sp_gr: '1.003-1.035',
  urine_pro: '(-)', // 參考值 (-) ~ (+/-)
  urine_bld: '(-)', // Occult Blood
  urine_glu: '(-)',
  urine_bil: '(-)', // Bilirubin
  urine_uro: '<=1.5', // Urobilinogen
  urine_ket: '(-)', // Ketone
  urine_nit: '(-)', // Nitrite
  urine_leu: '(-)', // WBC esterase
  urine_rbc: '0-2', // /HPF
  urine_wbc: '0-5', // /HPF
  urine_cast: '0-2', // Hyaline cast /LPF
  micro_alb: '<30', // mg/L
  
  // --- 肝膽功能 ---
  t_bil: '0.3-1.0', // mg/dL
  d_bil: '0.03-0.18', // mg/dL
  ast: '8-31', // GOT (U/L)
  alt: '0-41', // GPT (U/L)
  tp: '6.4-8.9', // g/dL
  alb: '3.5-5.7', // g/dL
  alp_liver: '34-104', // U/L (Alkaline phosphatase)
  ggt: '9-64', // U/L (r-GT)
  ldh: '140-271', // U/L
  nh3: '16-53', // umol/L
  
  // --- 血脂 / 心血管 ---
  tg: '<150', // mg/dL
  chol: '<200', // mg/dL
  hdl: '>40', // mg/dL (需大於)
  ldl: '<130', // mg/dL
  ck: '30-223', // U/L
  
  // --- 甲狀腺 ---
  tsh: '0.17-4.05', // mIU/L
  free_t4: '0.89-1.79', // ng/dL
  t3: '78.0-182.0', // ng/dL
  t4: '4.6-12.4', // ug/dL
  
  // --- 腫瘤標記 ---
  afp: '<20.0', // ng/mL
  cea: '<5.0', // ng/mL
  ca125: '<35.0', // U/mL
  ca199: '<37.0', // U/mL
  psa: '<4.0', // ng/mL
  
  // --- 電解質與生化 ---
  iron: '51-209', // ug/dL
  tibc: '268-593', // ug/dL
  ferritin: 'M:21.81-274.66;F:4.63-204.0', // ng/mL
  ca_blood: '2.15-2.58', // mmol/L
  p: '2.5-5', // mg/dL
  mg: '0.78-1.11', // mmol/L
  na: '136-145', // mmol/L
  k: '3.5-5.1', // mmol/L
  cl: '98-107', // mmol/L
  vit_d: '30-100', // ng/mL
  
  // --- 職業病特異性 (法規值) ---
  pb_blood: 'M<40;F<30', // ug/dL
  urine_hg: '<35', // ug/g Cr
  urine_ni: '<30', // ug/g Cr
  urine_cd: '<5', // ug/g Cr
  urine_25hd: '<0.4', // mg/g Cr
  urine_ttma: '<500', // ug/g Cr
};

// 共用的基本檢查項目
const BASIC_ITEMS = [
  { id: 'height', label: '身高', unit: 'cm', type: 'number', checkType: 'all' },
  { id: 'weight', label: '體重', unit: 'kg', type: 'number', checkType: 'all' },
  { id: 'waist', label: '腰圍', unit: 'cm', type: 'number', checkType: 'all' },
  { id: 'bp_sys', label: '收縮壓', unit: 'mmHg', type: 'number', ref: '<140', checkType: 'all' },
  { id: 'bp_dia', label: '舒張壓', unit: 'mmHg', type: 'number', ref: '<90', checkType: 'all' },
  { id: 'vision_l', label: '左眼視力(矯正)', unit: '', type: 'number', checkType: 'all' },
  { id: 'vision_r', label: '右眼視力(矯正)', unit: '', type: 'number', checkType: 'all' },
  { id: 'color_vision', label: '辨色力', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
];

const HAZARD_DB = {
  '01': {
    name: '01. 高溫作業',
    category: '物理性危害',
    items: [
      { id: 'phy_heart', label: '心臟血管系統', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'ekg', label: '心電圖', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'fvc', label: 'FVC', unit: '% pred', type: 'number', ref: '>=80', checkType: 'all' },
      { id: 'fev1', label: 'FEV1', unit: '% pred', type: 'number', ref: '>=80', checkType: 'all' },
      { id: 'fev1_fvc', label: 'FEV1/FVC', unit: '%', type: 'number', ref: '>=70', checkType: 'all' },
      { id: 'lung_pattern', label: '肺功能判讀', type: 'select', options: ['正常', '阻塞性通氣障礙', '限制性通氣障礙', '混合型通氣障礙', '異常(其他)'], ref: '正常', checkType: 'all' },
      { id: 'ac_sugar', label: '飯前血糖 (AC)', unit: 'mg/dL', type: 'number', ref: REF_DATA.ac_sugar, checkType: 'all' },
      { id: 'bun', label: 'BUN', unit: 'mg/dL', type: 'number', ref: REF_DATA.bun, checkType: 'all' },
      { id: 'cre', label: '肌酸酐', unit: 'mg/dL', type: 'number', ref: REF_DATA.cre, checkType: 'all' },
      { id: 'na', label: '鈉 (Na)', unit: 'mmol/L', type: 'number', ref: REF_DATA.na, checkType: 'all' },
      { id: 'k', label: '鉀 (K)', unit: 'mmol/L', type: 'number', ref: REF_DATA.k, checkType: 'all' },
      { id: 'cl', label: '氯 (Cl)', unit: 'mmol/L', type: 'number', ref: REF_DATA.cl, checkType: 'all' },
      { id: 'hb', label: '血色素', unit: 'g/dL', type: 'number', ref: REF_DATA.hb, checkType: 'all' },
      { id: 'urine_pro', label: '尿蛋白', type: 'select', options: ['(-)', '(+/-)', '(+)', '(++)'], ref: '(-)', checkType: 'all' },
      { id: 'urine_bld', label: '尿潛血', type: 'select', options: ['(-)', '(+/-)', '(+)', '(++)'], ref: '(-)', checkType: 'all' },
    ]
  },
  '02': {
    name: '02. 噪音作業',
    category: '物理性危害',
    items: [
      { id: 'phy_ear', label: '耳道檢查', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'l_4k', label: '左耳 4000Hz', unit: 'dB', type: 'number', ref: '<30', checkType: 'all' },
      { id: 'r_4k', label: '右耳 4000Hz', unit: 'dB', type: 'number', ref: '<30', checkType: 'all' },
      { id: 'l_avg', label: '左耳平均(0.5-2k)', unit: 'dB', type: 'number', ref: '<25', checkType: 'all' },
      { id: 'r_avg', label: '右耳平均(0.5-2k)', unit: 'dB', type: 'number', ref: '<25', checkType: 'all' },
    ]
  },
  '03': {
    name: '03. 游離輻射作業',
    category: '物理性危害',
    items: [
      { id: 'phy_head', label: '頭頸部/眼睛', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'cxr', label: '胸部X光', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'fvc', label: 'FVC', unit: '% pred', type: 'number', ref: '>=80', checkType: 'entry' },
      { id: 'lung_pattern', label: '肺功能判讀', type: 'select', options: ['正常', '阻塞性', '限制性', '混合型', '異常'], ref: '正常', checkType: 'entry' },
      { id: 'free_t4', label: 'Free T4', unit: 'ng/dL', type: 'number', ref: REF_DATA.free_t4, checkType: 'all' },
      { id: 'tsh', label: 'TSH', unit: 'mIU/L', type: 'number', ref: REF_DATA.tsh, checkType: 'all' },
      { id: 'hgb', label: '血色素', unit: 'g/dL', type: 'number', ref: REF_DATA.hb, checkType: 'all' },
      { id: 'wbc', label: '白血球', unit: '10^3/uL', type: 'number', ref: REF_DATA.wbc, checkType: 'all' },
      { id: 'plt', label: '血小板', unit: '10^3/uL', type: 'number', ref: REF_DATA.plt, checkType: 'all' },
    ]
  },
  '04': {
    name: '04. 異常氣壓作業',
    category: '物理性危害',
    items: [
      { id: 'lung_func', label: '肺功能判讀', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'ekg', label: '心電圖', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'joint', label: '關節長骨X光', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'periodic' },
    ]
  },
  '05': {
    name: '05. 鉛作業',
    category: '化學性危害',
    items: [
      { id: 'phy_neuro', label: '神經系統', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'pb_blood', label: '血中鉛', unit: 'μg/dL', type: 'number', ref: REF_DATA.pb_blood, checkType: 'all' },
      { id: 'hgb', label: '血色素', unit: 'g/dL', type: 'number', ref: REF_DATA.hb, checkType: 'all' },
      { id: 'urine_pro', label: '尿蛋白', type: 'select', options: ['(-)', '(+)'], ref: '(-)', checkType: 'all' },
    ]
  },
  '06': {
    name: '06. 四烷基鉛作業',
    category: '化學性危害',
    items: [
      { id: 'phy_neuro', label: '神經/精神檢查', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'urine_pb', label: '尿中鉛', unit: 'μg/L', type: 'number', ref: '<150', checkType: 'all' },
    ]
  },
  '07': {
    name: '07. 1,1,2,2-四氯乙烷作業',
    category: '有機溶劑',
    items: [
      { id: 'alt', label: 'ALT', unit: 'U/L', type: 'number', ref: REF_DATA.alt, checkType: 'all' },
      { id: 'ggt', label: 'r-GT', unit: 'U/L', type: 'number', ref: REF_DATA.ggt, checkType: 'all' },
      { id: 'phy_neuro', label: '神經系統', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '08': {
    name: '08. 四氯化碳作業',
    category: '有機溶劑',
    items: [
      { id: 'alt', label: 'ALT (GPT)', unit: 'U/L', type: 'number', ref: '0-41', checkType: 'all' },
      { id: 'ggt', label: 'r-GT', unit: 'U/L', type: 'number', ref: '9-64', checkType: 'all' },
      { id: 'phy_renal', label: '腎臟系統', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '09': {
    name: '09. 二硫化碳作業',
    category: '有機溶劑',
    items: [
      { id: 'alt', label: 'ALT (GPT)', unit: 'U/L', type: 'number', ref: '0-41', checkType: 'all' },
      { id: 'fundus', label: '眼底檢查', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'ekg', label: '心電圖', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '10': {
    name: '10. 三氯乙烯、四氯乙烯作業',
    category: '有機溶劑',
    items: [
      { id: 'alt', label: 'ALT (GPT)', unit: 'U/L', type: 'number', ref: '0-41', checkType: 'all' },
      { id: 'ggt', label: 'r-GT', unit: 'U/L', type: 'number', ref: '9-64', checkType: 'all' },
      { id: 'phy_skin', label: '皮膚/黏膜', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '11': {
    name: '11. 二甲基甲醯胺作業',
    category: '有機溶劑',
    items: [
      { id: 'alt', label: 'ALT (GPT)', unit: 'U/L', type: 'number', ref: '0-41', checkType: 'all' },
      { id: 'ggt', label: 'r-GT', unit: 'U/L', type: 'number', ref: '9-64', checkType: 'all' },
      { id: 'phy_liver', label: '肝臟檢查', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '12': {
    name: '12. 正己烷作業',
    category: '有機溶劑',
    items: [
      { id: 'phy_neuro', label: '神經系統', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'urine_25hd', label: '尿中 2,5-HD', unit: 'mg/g Cr', type: 'number', ref: REF_DATA.urine_25hd, checkType: 'all' },
    ]
  },
  '13': {
    name: '13. 聯苯胺及其鹽類等作業',
    category: '特定化學物質',
    items: [
      { id: 'urine_cyto', label: '尿沉渣(細胞學)', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'urine_bld', label: '尿潛血', type: 'select', options: ['(-)', '(+)'], ref: '(-)', checkType: 'all' },
      { id: 'phy_uro', label: '泌尿系統檢查', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '14': {
    name: '14. 鈹及其化合物作業',
    category: '特定化學物質',
    items: [
      { id: 'cxr', label: '胸部X光', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'fvc', label: 'FVC', unit: '% pred', type: 'number', ref: '>=80', checkType: 'all' },
      { id: 'fev1', label: 'FEV1', unit: '% pred', type: 'number', ref: '>=80', checkType: 'all' },
      { id: 'phy_skin', label: '皮膚/肺部', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '15': {
    name: '15. 氯乙烯作業',
    category: '特定化學物質',
    items: [
      { id: 'alt', label: 'ALT (GPT)', unit: 'U/L', type: 'number', ref: '0-41', checkType: 'all' },
      { id: 'ggt', label: 'r-GT', unit: 'U/L', type: 'number', ref: '9-64', checkType: 'all' },
      { id: 'cxr', label: '胸部X光', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'phy_liver', label: '肝脾觸診', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '16': {
    name: '16. 苯作業',
    category: '特定化學物質',
    items: [
      { id: 'wbc', label: '白血球', unit: '10^3/uL', type: 'number', ref: REF_DATA.wbc, checkType: 'all' },
      { id: 'rbc', label: '紅血球', unit: '10^6/uL', type: 'number', ref: REF_DATA.rbc, checkType: 'all' },
      { id: 'hgb', label: '血色素', unit: 'g/dL', type: 'number', ref: REF_DATA.hb, checkType: 'all' },
      { id: 'plt', label: '血小板', unit: '10^3/uL', type: 'number', ref: REF_DATA.plt, checkType: 'all' },
      { id: 'urine_ttma', label: '尿中 t,t-MA', unit: 'μg/g Cr', type: 'number', ref: REF_DATA.urine_ttma, checkType: 'all' },
    ]
  },
  '17': {
    name: '17. 二異氰酸甲苯(TDI)等作業',
    category: '特定化學物質',
    items: [
      { id: 'fvc', label: 'FVC', unit: '% pred', type: 'number', ref: '>=80', checkType: 'all' },
      { id: 'fev1', label: 'FEV1', unit: '% pred', type: 'number', ref: '>=80', checkType: 'all' },
      { id: 'lung_pattern', label: '肺功能判讀', type: 'select', options: ['正常', '阻塞性通氣障礙', '限制性通氣障礙', '混合型通氣障礙'], ref: '正常', checkType: 'all' },
      { id: 'cxr', label: '胸部X光', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'entry' },
    ]
  },
  '18': {
    name: '18. 石綿作業',
    category: '粉塵危害',
    items: [
      { id: 'cxr_code', label: '胸部X光 (ILO)', type: 'select', options: ['Category 0', 'Category 1+'], ref: 'Category 0', checkType: 'all' },
      { id: 'fvc', label: 'FVC', unit: '% pred', type: 'number', ref: '>=80', checkType: 'all' },
      { id: 'lung_pattern', label: '肺功能判讀', type: 'select', options: ['正常', '限制性通氣障礙', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '19': {
    name: '19. 砷及其化合物作業',
    category: '特定化學物質',
    items: [
      { id: 'urine_as', label: '尿中無機砷', unit: 'μg/L', type: 'number', ref: '<35', checkType: 'all' },
      { id: 'cxr', label: '胸部X光', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'phy_skin', label: '皮膚(角化/色素)', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '20': {
    name: '20. 錳及其化合物作業',
    category: '特定化學物質',
    items: [
      { id: 'phy_neuro', label: '神經(巴金森)', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'blood_mn', label: '血中錳', unit: 'μg/L', type: 'number', checkType: 'periodic' }, // 指引建議
    ]
  },
  '21': {
    name: '21. 黃磷作業',
    category: '特定化學物質',
    items: [
      { id: 'phy_dental', label: '牙齒/下顎檢查', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'alt', label: 'ALT (GPT)', unit: 'U/L', type: 'number', ref: '0-41', checkType: 'all' },
    ]
  },
  '22': {
    name: '22. 聯吡啶或巴拉刈作業',
    category: '特定化學物質',
    items: [
      { id: 'phy_skin', label: '皮膚/指甲', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'phy_eye', label: '眼睛檢查', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '23': {
    name: '23. 粉塵作業',
    category: '粉塵危害',
    items: [
      { id: 'phy_resp', label: '呼吸系統檢查', type: 'select', options: ['正常', '異常'], checkType: 'all' },
      { id: 'cxr_code', label: '胸部X光 (ILO分型)', type: 'select', options: ['Cat 0', 'Cat 1', 'Cat 2', 'Cat 3'], ref: 'Cat 0', checkType: 'all' },
      { id: 'fvc', label: 'FVC', unit: '% pred', type: 'number', ref: '>=80', checkType: 'all' },
      { id: 'fev1', label: 'FEV1', unit: '% pred', type: 'number', ref: '>=80', checkType: 'all' },
      { id: 'fev1_fvc', label: 'FEV1/FVC', unit: '%', type: 'number', ref: '>=70', checkType: 'all' },
      { id: 'lung_pattern', label: '肺功能判讀結果', type: 'select', options: ['正常', '阻塞性通氣障礙', '限制性通氣障礙', '混合型通氣障礙', '異常(其他)'], ref: '正常', checkType: 'all' },
    ]
  },
  '24': {
    name: '24. 鉻酸及其鹽類作業',
    category: '特定化學物質',
    items: [
      { id: 'phy_nose', label: '鼻中膈檢查', type: 'select', options: ['正常', '異常(穿孔/潰瘍)'], ref: '正常', checkType: 'all' },
      { id: 'urine_cr', label: '尿中鉻', unit: 'μg/g Cr', type: 'number', checkType: 'periodic' },
    ]
  },
  '25': {
    name: '25. 鎘及其化合物作業',
    category: '特定化學物質',
    items: [
      { id: 'urine_cd', label: '尿中鎘', unit: 'μg/g Cr', type: 'number', ref: '<5', checkType: 'all' },
      { id: 'urine_b2m', label: '尿中 β2-微球蛋白', unit: 'μg/g Cr', type: 'number', checkType: 'all' },
      { id: 'urine_pro', label: '尿蛋白', type: 'select', options: ['(-)', '(+)'], ref: '(-)', checkType: 'all' },
    ]
  },
  '26': {
    name: '26. 鎳及其化合物作業',
    category: '特定化學物質',
    items: [
      { id: 'phy_skin', label: '皮膚檢查', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'urine_ni', label: '尿中鎳', unit: 'μg/g Cr', type: 'number', ref: '<30', checkType: 'periodic' },
    ]
  },
  '27': {
    name: '27. 乙基汞化合物作業',
    category: '特定化學物質',
    items: [
      { id: 'phy_neuro', label: '神經/視野檢查', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'blood_hg', label: '血中汞', unit: 'μg/L', type: 'number', checkType: 'periodic' },
    ]
  },
  '28': {
    name: '28. 溴丙烷作業',
    category: '特定化學物質',
    items: [
      { id: 'hgb', label: '血色素 (Hb)', unit: 'g/dL', type: 'number', checkType: 'all' },
      { id: 'phy_neuro', label: '神經學檢查(末梢)', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '29': {
    name: '29. 1,3-丁二烯作業',
    category: '特定化學物質',
    items: [
      { id: 'hgb', label: '血色素 (Hb)', unit: 'g/dL', type: 'number', checkType: 'all' },
      { id: 'wbc', label: '白血球 (WBC)', unit: '10^3/uL', type: 'number', checkType: 'all' },
      { id: 'plt', label: '血小板 (PLT)', unit: '10^3/uL', type: 'number', checkType: 'all' },
      { id: 'phy_lymph', label: '淋巴/血液檢查', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '30': {
    name: '30. 甲醛作業',
    category: '特定化學物質',
    items: [
      { id: 'phy_resp', label: '呼吸系統', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
      { id: 'cxr', label: '胸部X光', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'entry' },
      { id: 'fvc', label: 'FVC', unit: '% pred', type: 'number', ref: '>=80', checkType: 'all' },
      { id: 'fev1', label: 'FEV1', unit: '% pred', type: 'number', ref: '>=80', checkType: 'all' },
      { id: 'fev1_fvc', label: 'FEV1/FVC', unit: '%', type: 'number', ref: '>=70', checkType: 'all' },
      { id: 'lung_pattern', label: '肺功能判讀', type: 'select', options: ['正常', '阻塞性', '限制性', '混合型', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '31': {
    name: '31. 銦及其化合物作業',
    category: '特定化學物質',
    items: [
      { id: 'serum_in', label: '血清銦', unit: 'μg/L', type: 'number', ref: '<3', checkType: 'periodic' },
      { id: 'cxr', label: '胸部X光', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '32': {
    name: '32. 汞及其無機化合物作業',
    category: '特定化學物質',
    items: [
      { id: 'urine_hg', label: '尿中汞', unit: 'μg/g Cr', type: 'number', ref: '<35', checkType: 'periodic' },
      { id: 'urine_pro', label: '尿蛋白', type: 'select', options: ['(-)', '(+)'], ref: '(-)', checkType: 'all' },
      { id: 'phy_neuro', label: '神經(顫抖)', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  },
  '99': {
    name: '99. 其他/通用',
    category: '其他',
    items: [
      { id: 'doc_note', label: '醫師理學檢查', type: 'select', options: ['正常', '異常'], ref: '正常', checkType: 'all' },
    ]
  }
};

const HAZARD_TYPES_LIST = Object.keys(HAZARD_DB).sort((a, b) => parseInt(a) - parseInt(b)).map(key => ({
  id: key,
  name: HAZARD_DB[key].name,
  category: HAZARD_DB[key].category
}));

const GRADE_RECOMMENDATIONS = {
  1: { label: '第一級管理', desc: '檢查結果正常，或部分異常但經醫師判定無異常。', actions: ['維持現有作業環境控制措施。', '持續定期實施特殊健康檢查。'], color: 'bg-green-100 text-green-800' },
  2: { label: '第二級管理', desc: '檢查結果異常，經醫師判定與工作無關（個人疾病）。', actions: ['提供個人健康指導。', '建議至醫療機構追蹤治療。'], color: 'bg-blue-100 text-blue-800' },
  3: { label: '第三級管理', desc: '檢查結果異常，無法確定是否與工作有關，需職業醫學科評估。', actions: ['安排職業醫學科醫師評估。', '檢視環境監測紀錄。'], color: 'bg-yellow-100 text-yellow-800' },
  4: { label: '第四級管理', desc: '檢查結果異常，且經醫師判定與工作有關。', actions: ['立即採取危害控制措施。', '實施健康配工。', '通報職業病。'], color: 'bg-red-100 text-red-800' }
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// -----------------------------------------------------------------------------
// Helper: 智慧判讀邏輯
// -----------------------------------------------------------------------------
const checkAbnormal = (value, ref, gender) => {
  if (!ref || value === '') return false;

  // 1. 處理文字型判斷
  if (isNaN(parseFloat(value))) {
    // 異常關鍵字
    if (['異常', '阻塞性', '限制性', '混合型', '有', 'Positive', '+'].some(k => value.includes(k))) return true;
    // 尿液等定性檢查，若參考值是 (-)，只要不是 (-) 就異常 (包含 +/-, 1+ 等)
    if (ref === '(-)') {
        if (value === '(-)' || value === '-') return false;
        return true;
    }
    if (ref === '正常' && value !== '正常') return true;
    return false; 
  }

  // 2. 處理數值型判斷
  const num = parseFloat(value);
  if (isNaN(num)) return false;

  // 處理性別差異 (格式: "M:min-max;F:min-max" 或 "M<40;F<30")
  let targetRef = ref;
  if (ref.includes('M:') && ref.includes('F:')) {
    const parts = ref.split(';');
    const malePart = parts.find(p => p.trim().startsWith('M:'));
    const femalePart = parts.find(p => p.trim().startsWith('F:'));
    if (malePart && femalePart) {
       targetRef = gender === '男' ? malePart.replace('M:', '').trim() : femalePart.replace('F:', '').trim();
    }
  }

  // 判斷範圍
  if (targetRef.includes('-')) {
    const [min, max] = targetRef.split('-').map(Number);
    return num < min || num > max; // 超出範圍為異常
  } else if (targetRef.includes('<=')) { 
    const limit = parseFloat(targetRef.replace('<=', ''));
    return num > limit; // 大於限制為異常
  } else if (targetRef.includes('>=')) { 
    const limit = parseFloat(targetRef.replace('>=', ''));
    return num < limit; // 小於限制為異常 (例如 FVC >= 80% 是正常)
  } else if (targetRef.includes('<')) {
    const limit = parseFloat(targetRef.replace('<', ''));
    return num >= limit; // 大於等於限制為異常
  } else if (targetRef.includes('>')) {
    const limit = parseFloat(targetRef.replace('>', ''));
    return num <= limit; // 小於等於限制為異常 (例如 HDL > 40 是正常)
  }

  return false;
};

export default function OccupationalHealthApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [isXlsxLoaded, setIsXlsxLoaded] = useState(false);
  
  // 基本資料 (移除身分證)
  const [newCase, setNewCase] = useState({
    name: '', gender: '男', workerId: '', dob: '', employmentDate: '', checkDate: new Date().toISOString().split('T')[0],
    company: '', dept: '', 
    pastWork: '', pastWorkStart: '', pastWorkEnd: '', pastWorkYears: '',
    currentWorkStart: '', currentWorkYears: '', dailyHours: '',
    checkType: '定期檢查', hazardType: '01',
    grade: '1', doctorNote: '', nurseNote: '', itemResults: {} 
  });
  
  // Clean up address if it was initialized
  useEffect(() => {
    if (newCase.address !== undefined) {
       const { address, ...rest } = newCase;
       setNewCase(rest);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'entry') {
        const defaultResults = {};
        const isEntryCheck = newCase.checkType === '新進員工(受僱時)';
        
        BASIC_ITEMS.forEach(item => {
            if (!newCase.itemResults[item.id]) defaultResults[item.id] = { value: '', isAbnormal: false };
        });

        const specificItems = HAZARD_DB[newCase.hazardType]?.items || [];
        specificItems.filter(item => {
            if (item.checkType === 'all') return true;
            if (isEntryCheck && item.checkType === 'entry') return true;
            if (!isEntryCheck && item.checkType === 'periodic') return true;
            return false;
        }).forEach(item => {
            if (!newCase.itemResults[item.id]) defaultResults[item.id] = { value: '', isAbnormal: false };
        });

        setNewCase(prev => ({ ...prev, itemResults: { ...prev.itemResults, ...defaultResults } }));
    }
  }, [newCase.hazardType, newCase.checkType, activeTab]);

  // Load Scripts
  useEffect(() => {
    const xlsxScript = document.createElement('script');
    xlsxScript.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
    xlsxScript.async = true;
    xlsxScript.onload = () => setIsXlsxLoaded(true);
    document.body.appendChild(xlsxScript);

    const pdfScript = document.createElement('script');
    pdfScript.src = "https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js";
    pdfScript.async = true;
    document.body.appendChild(pdfScript);

    return () => {
      if(document.body.contains(xlsxScript)) document.body.removeChild(xlsxScript);
      if(document.body.contains(pdfScript)) document.body.removeChild(pdfScript);
    }
  }, []);

  const handleAddCase = () => {
    if(!newCase.name) {
        alert('請輸入員工姓名');
        return;
    }
    const id = generateId();
    const caseEntry = { ...newCase, id };
    setEmployees(prev => [caseEntry, ...prev]);
    setSelectedEmp(caseEntry);
    setActiveTab('list');
    setNewCase({
        name: '', gender: '男', workerId: '', dob: '', employmentDate: '', checkDate: new Date().toISOString().split('T')[0],
        company: '', dept: '', 
        pastWork: '', pastWorkStart: '', pastWorkEnd: '', pastWorkYears: '',
        currentWorkStart: '', currentWorkYears: '', dailyHours: '',
        checkType: '定期檢查', hazardType: '01', grade: '1', doctorNote: '', nurseNote: '', itemResults: {} 
    });
  };

  const handleItemResultChange = (itemId, field, value, itemDef) => {
    let isAbnormal = newCase.itemResults[itemId]?.isAbnormal || false;
    
    if (field === 'value') {
        // 自動判讀邏輯
        if (itemDef && itemDef.ref) {
            isAbnormal = checkAbnormal(value, itemDef.ref, newCase.gender);
        }
        
        // 肺功能特殊連動
        if (itemId === 'fev1_fvc' || itemId === 'fvc' || itemId === 'fev1') {
            const getVal = (key) => key === itemId ? parseFloat(value) : parseFloat(newCase.itemResults[key]?.value || 0);
            const currentFVC = getVal('fvc');
            const currentRatio = getVal('fev1_fvc');
            
            if (!isNaN(currentFVC) && !isNaN(currentRatio)) {
                let pattern = '正常';
                const isObstructive = currentRatio < 70; 
                const isRestrictive = currentFVC < 80; 

                if (isObstructive && isRestrictive) pattern = '混合型通氣障礙';
                else if (isObstructive) pattern = '阻塞性通氣障礙';
                else if (isRestrictive) pattern = '限制性通氣障礙';

                if (newCase.itemResults['lung_pattern']) {
                    setTimeout(() => {
                        setNewCase(prev => ({
                            ...prev,
                            itemResults: {
                                ...prev.itemResults,
                                ['lung_pattern']: { value: pattern, isAbnormal: pattern !== '正常' }
                            }
                        }));
                    }, 0);
                }
            }
        }
    }
    if (field === 'isAbnormal') isAbnormal = value;

    setNewCase(prev => ({
        ...prev,
        itemResults: { ...prev.itemResults, [itemId]: { value: field === 'value' ? value : (prev.itemResults[itemId]?.value || ''), isAbnormal: isAbnormal } }
    }));
  };

  const handleDelete = (id) => {
    if(confirm('確定刪除此筆資料？')) setEmployees(prev => prev.filter(e => e.id !== id));
  };

  const reportRef = useRef();
  const generatePDF = () => {
    if (!reportRef.current) return;
    if (typeof window.html2pdf === 'undefined') { window.print(); return; }
    const element = reportRef.current;
    const opt = {
      margin: 5, filename: `${selectedEmp.name}_特檢報告.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    window.html2pdf().set(opt).from(element).save();
  };

  const getAllCheckItems = () => {
    const items = new Map();
    // 先加入基本項目
    BASIC_ITEMS.forEach(item => {
        if (!items.has(item.id)) items.set(item.id, item.label);
    });
    // 再加入所有危害作業的特殊項目
    Object.values(HAZARD_DB).forEach(hazard => {
        hazard.items.forEach(item => {
            if (!items.has(item.id)) {
                items.set(item.id, item.label);
            }
        });
    });
    return Array.from(items.entries());
  };

  const downloadTemplate = () => {
    if (!isXlsxLoaded || !window.XLSX) {
      alert("Excel 處理元件尚未載入完成，請稍候再試。");
      return;
    }

    // 1. 準備標題列
    const allCheckItems = getAllCheckItems();
    const headers = [
        '姓名', '工號', '部門', '性別', '出生日期', '受僱日期', 
        '作業代碼', '檢查日期', '檢查原因', '管理分級', 
        '醫師建議', '護理指導',
        ...allCheckItems.map(([id, label]) => `${label} (${id})`) // 動態欄位
    ];

    // 2. 準備範例資料
    const example1 = {
        '姓名': '王小明', '工號': 'A001', '部門': '沖壓課', '性別': '男', '作業代碼': '02',
        '檢查日期': '2025-10-01', '檢查原因': '定期檢查', '管理分級': '3', '醫師建議': '定期追蹤',
        '左耳 4000Hz (l_4k)': '45', '右耳 4000Hz (r_4k)': '25', '身高 (height)': '175', '體重 (weight)': '70'
    };
    const example2 = {
        '姓名': '李美華', '工號': 'B002', '部門': '品管課', '性別': '女', '作業代碼': '05',
        '檢查日期': '2025-11-15', '檢查原因': '新進員工(受僱時)', '管理分級': '1', '醫師建議': '正常',
        '血中鉛 (pb_blood)': '5', '血色素 (hb)': '13.5', '身高 (height)': '160', '體重 (weight)': '50'
    };

    // 3. 轉換為 Sheet
    const ws = window.XLSX.utils.json_to_sheet([example1, example2], { header: headers });
    
    // 4. 調整欄寬
    const wscols = headers.map(() => ({ wch: 20 }));
    ws['!cols'] = wscols;

    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, "匯入範本");
    
    // 5. 增加說明頁
    const infoWs = window.XLSX.utils.aoa_to_sheet([
        ['作業代碼', '作業名稱'],
        ...HAZARD_TYPES_LIST.map(t => [t.id, t.name])
    ]);
    window.XLSX.utils.book_append_sheet(wb, infoWs, "代碼說明");

    window.XLSX.writeFile(wb, "特殊健檢匯入範本.xlsx");
  };

  const handleFileUpload = (e) => {
    if (!isXlsxLoaded || !window.XLSX) {
        alert("Excel 處理元件尚未載入完成，請稍候再試。");
        return;
    }

    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = window.XLSX.read(bstr, { type: 'binary' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const data = window.XLSX.utils.sheet_to_json(ws);
        
        const allCheckItemsMap = new Map(getAllCheckItems());

        const formattedData = data.map(item => {
            const hType = item['作業代碼'] ? String(item['作業代碼']).padStart(2,'0') : '01';
            const importedItemResults = {};
            
            // 自動解析檢查項目欄位
            Object.keys(item).forEach(key => {
                // 檢查 Key 是否包含在我們的 ID 列表中 (格式: Label (id))
                const match = key.match(/\((.+)\)$/);
                if (match) {
                    const id = match[1];
                    if (allCheckItemsMap.has(id)) {
                        const val = String(item[key]);
                        // 進行自動判讀
                        let ref;
                        // 先找基本項目
                        const basicItem = BASIC_ITEMS.find(i => i.id === id);
                        if (basicItem) ref = basicItem.ref;
                        else {
                            // 再找特殊項目
                            ref = HAZARD_DB[hType]?.items.find(i => i.id === id)?.ref;
                        }
                        
                        const isAbnormal = checkAbnormal(val, ref, item['性別'] || '男');
                        importedItemResults[id] = { value: val, isAbnormal };
                    }
                }
            });

            return {
              id: generateId(),
              name: item['姓名'] || '未命名',
              workerId: item['工號'] || '',
              gender: item['性別'] || '男',
              dept: item['部門'] || '',
              hazardType: hType,
              checkType: item['檢查原因'] || '定期檢查',
              checkDate: item['檢查日期'] || new Date().toISOString().split('T')[0],
              grade: String(item['管理分級'] || '1'),
              doctorNote: item['醫師建議'] || '',
              nurseNote: item['護理指導'] || '',
              itemResults: importedItemResults,
              dob: item['出生日期'] || '',
              employmentDate: item['受僱日期'] || '',
              company: '',
              pastWork: '', pastWorkStart: '', pastWorkEnd: '', pastWorkYears: '',
              currentWorkStart: '', currentWorkYears: '', dailyHours: '',
            };
        });

        setEmployees(prev => [...prev, ...formattedData]);
        setActiveTab('list');
        alert(`成功匯入 ${formattedData.length} 筆資料！`);
      } catch (err) {
        console.error(err);
        alert('檔案讀取失敗，請確認格式是否正確。');
      }
    };
    reader.readAsBinaryString(file);
  };

  // ... (Dashboard Data Calculation & Render remain same)
  const dashboardData = {};
  employees.forEach(e => {
      const hName = HAZARD_DB[e.hazardType]?.name || e.hazardType;
      if (!dashboardData[hName]) dashboardData[hName] = { total: 0, g1: 0, g2: 0, g3: 0, g4: 0 };
      dashboardData[hName].total += 1;
      if(e.grade === '1') dashboardData[hName].g1 += 1;
      if(e.grade === '2') dashboardData[hName].g2 += 1;
      if(e.grade === '3') dashboardData[hName].g3 += 1;
      if(e.grade === '4') dashboardData[hName].g4 += 1;
  });

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans">
      <header className="bg-teal-700 text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6" />
            <h1 className="text-xl font-bold tracking-wide">勞工特殊健檢管理系統</h1>
          </div>
          <nav className="flex space-x-1">
            {['dashboard', 'entry', 'list', 'import'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab ? 'bg-teal-800 text-white shadow-inner' : 'hover:bg-teal-600 text-teal-100'
                }`}
              >
                {tab === 'dashboard' && '儀表板'}
                {tab === 'entry' && '新增個案'}
                {tab === 'list' && '報告列表'}
                {tab === 'import' && '批次匯入'}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 flex gap-4">
                <BarChart2 className="w-12 h-12 text-teal-600 flex-shrink-0" />
                <div>
                    <h3 className="text-lg font-bold mb-2 text-gray-800">系統更新公告</h3>
                    <p className="text-gray-600 text-sm">
                        1. **智慧判讀升級**：整合台大醫院參考值，依據性別、年齡自動判斷異常數值。<br/>
                        2. **隱私強化**：全面移除身分證字號與地址欄位。<br/>
                        3. **批次匯入優化**：支援下載完整 32 類作業之檢查項目範本，並具備自動對應匯入功能。
                    </p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6">
                {Object.keys(dashboardData).length === 0 ? (
                    <div className="bg-white p-8 rounded-lg text-center text-gray-400 border border-dashed border-gray-300">
                        尚無檢查資料，請先新增個案或使用批次匯入功能。
                    </div>
                ) : (
                    Object.entries(dashboardData).map(([hazardName, data]) => (
                        <div key={hazardName} className="bg-white p-5 rounded-lg shadow border border-gray-100">
                            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
                                <h3 className="font-bold text-lg text-gray-800">{hazardName}</h3>
                                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">總人數: {data.total}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-4">
                                <div className="text-center p-3 bg-green-50 rounded border border-green-100"><div className="text-xs text-green-600 mb-1">第一級</div><div className="text-xl font-bold text-green-700">{data.g1}</div></div>
                                <div className="text-center p-3 bg-blue-50 rounded border border-blue-100"><div className="text-xs text-blue-600 mb-1">第二級</div><div className="text-xl font-bold text-blue-700">{data.g2}</div></div>
                                <div className="text-center p-3 bg-yellow-50 rounded border border-yellow-100"><div className="text-xs text-yellow-600 mb-1">第三級</div><div className="text-xl font-bold text-yellow-700">{data.g3}</div></div>
                                <div className="text-center p-3 bg-red-50 rounded border border-red-100"><div className="text-xs text-red-600 mb-1">第四級</div><div className="text-xl font-bold text-red-700">{data.g4}</div></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
          </div>
        )}

        {/* DATA ENTRY */}
        {activeTab === 'entry' && (
          <div className="max-w-5xl mx-auto bg-white p-8 rounded-lg shadow-lg border border-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-700 border-b pb-4 flex items-center gap-2">
              <Plus className="w-6 h-6"/> 新增特殊健檢報告
            </h2>
            
            <div className="mb-8">
                <h3 className="text-lg font-bold text-teal-800 mb-3 border-l-4 border-teal-500 pl-2">一、基本資料</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded border border-gray-200">
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">姓名</label><input type="text" value={newCase.name} onChange={e => setNewCase({...newCase, name: e.target.value})} className="w-full p-2 border rounded"/></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">工號</label><input type="text" value={newCase.workerId} onChange={e => setNewCase({...newCase, workerId: e.target.value})} className="w-full p-2 border rounded"/></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">性別 (影響參考值)</label><select value={newCase.gender} onChange={e => setNewCase({...newCase, gender: e.target.value})} className="w-full p-2 border rounded bg-white"><option value="男">男</option><option value="女">女</option></select></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">出生日期</label><input type="date" value={newCase.dob} onChange={e => setNewCase({...newCase, dob: e.target.value})} className="w-full p-2 border rounded"/></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">受僱日期</label><input type="date" value={newCase.employmentDate} onChange={e => setNewCase({...newCase, employmentDate: e.target.value})} className="w-full p-2 border rounded"/></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">檢查日期</label><input type="date" value={newCase.checkDate} onChange={e => setNewCase({...newCase, checkDate: e.target.value})} className="w-full p-2 border rounded"/></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">事業單位名稱(廠別)</label><input type="text" value={newCase.company} onChange={e => setNewCase({...newCase, company: e.target.value})} className="w-full p-2 border rounded"/></div>
                    <div><label className="block text-xs font-bold text-gray-500 mb-1">部門單位</label><input type="text" value={newCase.dept} onChange={e => setNewCase({...newCase, dept: e.target.value})} className="w-full p-2 border rounded"/></div>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-lg font-bold text-teal-800 mb-3 border-l-4 border-teal-500 pl-2">二、作業經歷</h3>
                <div className="bg-gray-50 p-4 rounded border border-gray-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <div className="md:col-span-1 text-sm font-bold">1. 曾經從事</div>
                        <div className="md:col-span-3"><input type="text" placeholder="作業名稱" value={newCase.pastWork} onChange={e=>setNewCase({...newCase, pastWork: e.target.value})} className="w-full p-1 border rounded text-sm"/></div>
                        <div className="md:col-span-8 flex items-center gap-2 text-sm"><span>起始:</span><input type="month" value={newCase.pastWorkStart} onChange={e=>setNewCase({...newCase, pastWorkStart: e.target.value})} className="border rounded p-1"/><span>截止:</span><input type="month" value={newCase.pastWorkEnd} onChange={e=>setNewCase({...newCase, pastWorkEnd: e.target.value})} className="border rounded p-1"/><span>共</span><input type="text" placeholder="年/月" value={newCase.pastWorkYears} onChange={e=>setNewCase({...newCase, pastWorkYears: e.target.value})} className="w-20 border rounded p-1"/></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                        <div className="md:col-span-1 text-sm font-bold">2. 特殊作業項目</div>
                        <div className="md:col-span-3">
                            <select className="w-full p-1 border rounded text-sm font-bold text-teal-700" value={newCase.hazardType} onChange={e=>setNewCase({...newCase, hazardType: e.target.value})}>
                                {HAZARD_TYPES_LIST.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                        <div className="md:col-span-8 flex items-center gap-2 text-sm"><span>起始:</span><input type="month" value={newCase.currentWorkStart} onChange={e=>setNewCase({...newCase, currentWorkStart: e.target.value})} className="border rounded p-1"/><span>截至:</span><span className="bg-gray-200 p-1 rounded">檢查日</span><span>共</span><input type="text" placeholder="年/月" value={newCase.currentWorkYears} onChange={e=>setNewCase({...newCase, currentWorkYears: e.target.value})} className="w-20 border rounded p-1"/></div>
                    </div>
                    <div className="flex items-center gap-2 text-sm"><span className="font-bold">3. 平均每日工時：</span><input type="number" value={newCase.dailyHours} onChange={e=>setNewCase({...newCase, dailyHours: e.target.value})} className="w-20 border rounded p-1"/> 小時</div>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="text-lg font-bold text-teal-800 mb-3 border-l-4 border-teal-500 pl-2">三、檢查時期 (原因)</h3>
                <div className="bg-gray-50 p-4 rounded border border-gray-200 flex flex-wrap gap-6">
                    {['新進員工(受僱時)', '變更作業', '定期檢查', '健康追蹤檢查'].map(type => (
                        <label key={type} className="flex items-center cursor-pointer">
                            <input type="radio" name="checkType" value={type} checked={newCase.checkType === type} onChange={e=>setNewCase({...newCase, checkType: e.target.value})} className="mr-2 w-4 h-4 text-teal-600"/>
                            <span className={newCase.checkType === type ? 'font-bold text-teal-800' : ''}>{type}</span>
                        </label>
                    ))}
                </div>
            </div>

            {/* Dynamic Items */}
            <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><ClipboardList className="w-5 h-5"/> 1. 基本檢查項目</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {BASIC_ITEMS.map(item => {
                        const res = newCase.itemResults[item.id] || { value: '', isAbnormal: false };
                        return (
                            <div key={item.id} className={`bg-white p-2 rounded border ${res.isAbnormal ? 'border-red-400 ring-1 ring-red-400' : 'border-gray-200'}`}>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs text-gray-500">{item.label} {item.unit ? `(${item.unit})` : ''}</label>
                                    {item.ref && <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">{item.ref}</span>}
                                </div>
                                {item.type === 'select' ? (
                                    <select value={res.value} onChange={e => handleItemResultChange(item.id, 'value', e.target.value, item)} className="w-full p-1 text-sm border rounded"><option value="">選擇</option>{item.options.map(o => <option key={o} value={o}>{o}</option>)}</select>
                                ) : (
                                    <input type="text" value={res.value} onChange={e => handleItemResultChange(item.id, 'value', e.target.value, item)} className={`w-full p-1 text-sm border rounded ${res.isAbnormal ? 'text-red-600 font-bold' : ''}`} placeholder={item.ref} />
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            <div className="bg-teal-50 p-6 rounded-lg border border-teal-200 mb-8">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-teal-900 flex items-center gap-2"><Stethoscope className="w-5 h-5"/> 2. 特殊檢查項目</h3>
                    <div className="flex gap-2">
                        <span className="text-xs bg-white px-2 py-1 rounded text-teal-600 border border-teal-200">{currentHazardInfo.name}</span>
                        <span className="text-xs bg-teal-600 px-2 py-1 rounded text-white border border-teal-600">{isEntryCheck ? '體格檢查' : '健康檢查'}</span>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    <div className="grid grid-cols-12 gap-4 px-2 py-1 text-xs font-bold text-gray-500 uppercase"><div className="col-span-4">檢查項目</div><div className="col-span-4">數值/結果</div><div className="col-span-2 text-center">參考值</div><div className="col-span-2">判定</div></div>
                    {activeItems.map((item) => {
                        const res = newCase.itemResults[item.id] || { value: '', isAbnormal: false };
                        const placeholder = (item.id==='fvc' || item.id==='fev1') ? '建議輸入%pred' : '輸入';
                        return (
                            <div key={item.id} className="grid grid-cols-12 gap-4 items-center p-3 bg-white rounded border border-gray-100 shadow-sm hover:border-teal-300 transition-colors">
                                <div className="col-span-4"><label className="text-sm font-medium text-gray-700">{item.label}</label></div>
                                <div className="col-span-4">
                                    {item.type === 'select' ? (
                                        <select value={res.value} onChange={(e) => handleItemResultChange(item.id, 'value', e.target.value, item)} className="w-full p-2 border rounded text-sm"><option value="">請選擇</option>{item.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                                    ) : (
                                        <input type="text" value={res.value} onChange={(e) => handleItemResultChange(item.id, 'value', e.target.value, item)} className={`w-full p-2 border rounded pr-8 text-sm ${res.isAbnormal ? 'text-red-600 font-bold border-red-300' : ''}`} placeholder={placeholder} />
                                    )}
                                </div>
                                <div className="col-span-2 text-center text-xs text-gray-500 bg-gray-50 rounded py-1">{item.ref || '-'}</div>
                                <div className="col-span-2 flex items-center"><label className={`w-full flex items-center justify-center cursor-pointer px-2 py-2 rounded transition-colors text-sm ${res.isAbnormal ? 'bg-red-100 text-red-700 font-bold border border-red-200' : 'bg-gray-50 text-gray-400 hover:bg-gray-200'}`}><input type="checkbox" checked={res.isAbnormal} onChange={(e) => handleItemResultChange(item.id, 'isAbnormal', e.target.checked, item)} className="hidden" />{res.isAbnormal ? '異常' : '正常'}</label></div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div><label className="text-sm font-bold text-gray-700 block mb-2">醫師診斷建議</label><textarea rows="4" value={newCase.doctorNote} onChange={e => setNewCase({...newCase, doctorNote: e.target.value})} className="w-full p-2 border border-gray-300 rounded"/></div>
                <div>
                    <label className="text-sm font-bold text-gray-700 block mb-2">管理分級判定</label>
                    <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <div className="flex gap-2 mb-3">{['1', '2', '3', '4'].map(g => (<button key={g} onClick={() => setNewCase({...newCase, grade: g})} className={`flex-1 py-2 rounded font-bold transition-all ${newCase.grade === g ? (g==='1'?'bg-green-600 text-white':g==='2'?'bg-blue-600 text-white':g==='3'?'bg-yellow-500 text-white':'bg-red-600 text-white') : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-100'}`}>{g} 級</button>))}</div>
                        <div className="text-sm text-gray-600">{GRADE_RECOMMENDATIONS[newCase.grade].desc}</div>
                        {abnormalCount > 0 && <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center animate-pulse"><AlertTriangle className="w-4 h-4 mr-2"/>系統偵測到 {abnormalCount} 項檢查結果異常，請確認管理分級。</div>}
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button onClick={handleAddCase} className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 rounded-lg shadow-lg flex items-center font-bold"><CheckCircle className="w-5 h-5 mr-2"/> 儲存並建立報告</button>
            </div>
          </div>
        )}

        {/* REPORT PREVIEW */}
        {activeTab === 'list' && selectedEmp && (
            <div className="flex flex-col items-center">
                <div className="w-full max-w-4xl flex justify-between mb-4"><button onClick={() => setSelectedEmp(null)} className="text-gray-500 hover:text-gray-800">← 返回列表</button><button onClick={generatePDF} className="bg-teal-600 text-white px-4 py-2 rounded shadow">下載 PDF</button></div>
                <div className="bg-white shadow-2xl overflow-hidden print:w-full" style={{ width: '210mm', minHeight: '297mm' }}>
                    <div ref={reportRef} className="p-10 text-gray-900 relative h-full flex flex-col text-sm">
                        <div className="text-center mb-4"><h1 className="text-2xl font-bold border-b-2 border-gray-800 inline-block pb-1 mb-1">{HAZARD_DB[selectedEmp.hazardType]?.name || selectedEmp.hazardType} 勞工特殊體格及健康檢查紀錄</h1></div>
                        
                        <div className="mb-4 border border-gray-400 p-2">
                            <h3 className="font-bold mb-2 bg-gray-100 p-1">一、基本資料</h3>
                            <div className="grid grid-cols-4 gap-2">
                                <div>姓名: {selectedEmp.name}</div>
                                <div>工號: {selectedEmp.workerId}</div>
                                <div>性別: {selectedEmp.gender}</div>
                                <div>出生日期: {selectedEmp.dob}</div>
                                <div>受僱日期: {selectedEmp.employmentDate}</div>
                                <div>檢查日期: {selectedEmp.checkDate}</div>
                                <div className="col-span-2">事業單位: {selectedEmp.company}</div>
                            </div>
                        </div>
                        
                        <div className="mb-4 border border-gray-400 p-2"><h3 className="font-bold mb-2 bg-gray-100 p-1">二、作業經歷</h3><p>1. 曾經從事: {selectedEmp.pastWork} ({selectedEmp.pastWorkStart} ~ {selectedEmp.pastWorkEnd}, 共 {selectedEmp.pastWorkYears})</p><p>2. 特殊作業項目: {HAZARD_DB[selectedEmp.hazardType]?.name} ({selectedEmp.currentWorkStart} ~ 至今, 共 {selectedEmp.currentWorkYears})</p><p>3. 平均每日工時: {selectedEmp.dailyHours} 小時</p></div>
                        
                        <div className="mb-4 border border-gray-400 p-2"><h3 className="font-bold mb-2 bg-gray-100 p-1">三、檢查時期</h3><p>檢查原因: {selectedEmp.checkType}</p></div>
                        
                        <div className="mb-4 border border-gray-400 p-2">
                            <h3 className="font-bold mb-2 bg-gray-100 p-1">四、檢查項目結果 ({selectedEmp.checkType === '新進員工(受僱時)' ? '體格檢查' : '健康檢查'})</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div><strong className="block border-b mb-1">基本項目</strong>{BASIC_ITEMS.map(item => (<div key={item.id} className="flex justify-between border-b border-dashed"><span>{item.label}</span><span>{selectedEmp.itemResults[item.id]?.value || '-'}</span></div>))}</div>
                                <div><strong className="block border-b mb-1">特殊項目</strong>{(HAZARD_DB[selectedEmp.hazardType]?.items || []).filter(item => { const isEntry = selectedEmp.checkType === '新進員工(受僱時)'; if(item.checkType === 'all') return true; if(isEntry && item.checkType === 'entry') return true; if(!isEntry && item.checkType === 'periodic') return true; return false; }).map(item => (<div key={item.id} className="flex justify-between border-b border-dashed"><span>{item.label}</span><span className={selectedEmp.itemResults[item.id]?.isAbnormal ? 'text-red-600 font-bold' : ''}>{selectedEmp.itemResults[item.id]?.value || '-'}{selectedEmp.itemResults[item.id]?.isAbnormal && ' (異)'}</span></div>))}</div>
                            </div>
                        </div>

                        <div className="mb-4 border border-gray-400 p-2"><h3 className="font-bold mb-2 bg-gray-100 p-1">五、健康管理與醫師建議</h3><div className="mb-2"><strong>管理分級: </strong><span className="text-xl font-bold mx-2">第 {selectedEmp.grade} 級管理</span><span className="text-sm text-gray-500">({GRADE_RECOMMENDATIONS[selectedEmp.grade].desc})</span></div><div className="mb-2"><strong>醫師建議: </strong> {selectedEmp.doctorNote}</div><div><strong>應處理及注意事項: </strong><ul className="list-disc pl-5 mt-1 text-xs text-gray-700">{GRADE_RECOMMENDATIONS[selectedEmp.grade].actions.map((act, i) => <li key={i}>{act}</li>)}</ul></div></div>
                        
                        <div className="mt-auto flex justify-end pt-4">
                            <div className="text-center">
                                <div className="border-b border-gray-400 w-48 mb-1"></div>
                                <p>臨場健康服務護理師 簽章</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* LIST VIEW */}
        {activeTab === 'list' && !selectedEmp && (
          <div className="bg-white rounded-lg shadow border border-gray-200">
             <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
                 <h2 className="font-bold text-gray-700">報告列表</h2>
                 <span className="text-xs text-gray-500">共 {employees.length} 筆資料</span>
             </div>
             <table className="min-w-full divide-y divide-gray-200"><thead className="bg-gray-50"><tr><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">姓名</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">作業種類</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">報告年度</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">分級結果</th><th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">操作</th></tr></thead><tbody>{employees.map(emp => (<tr key={emp.id}><td className="px-6 py-4">{emp.name}</td><td className="px-6 py-4">{HAZARD_DB[emp.hazardType]?.name}</td><td className="px-6 py-4">{new Date(emp.checkDate).getFullYear()}</td><td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold ${emp.grade==='1'?'bg-green-100 text-green-800':emp.grade==='2'?'bg-blue-100 text-blue-800':emp.grade==='3'?'bg-yellow-100 text-yellow-800':'bg-red-100 text-red-800'}`}>第 {emp.grade} 級</span></td><td className="px-6 py-4 flex gap-3"><button onClick={()=>setSelectedEmp(emp)} className="text-teal-600">查看</button><button onClick={()=>handleDelete(emp.id)} className="text-red-600">刪除</button></td></tr>))}</tbody></table>
          </div>
        )}
        {/* IMPORT */}
        {activeTab === 'import' && (
             <div className="max-w-xl mx-auto text-center space-y-8 py-12">
             <div className="bg-white p-12 rounded-lg shadow-lg border-2 border-dashed border-gray-300 hover:border-teal-500 transition-colors group">
               <Upload className="w-16 h-16 mx-auto text-gray-400 group-hover:text-teal-500 transition-colors mb-4" />
               <h3 className="text-xl font-medium text-gray-700 mb-2">批次匯入健檢資料</h3>
               <p className="text-gray-500 text-sm mb-6">請使用標準 Excel 格式 (.xlsx) 上傳</p>
               <input type="file" id="excel-upload" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
               <label htmlFor="excel-upload" className="cursor-pointer bg-teal-600 text-white px-8 py-3 rounded-full hover:bg-teal-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">選擇檔案</label>
             </div>
             <div className="text-center"><button onClick={downloadTemplate} className="text-teal-600 hover:text-teal-800 underline flex items-center justify-center mx-auto gap-2" disabled={!isXlsxLoaded}><FileSpreadsheet className="w-4 h-4"/>{isXlsxLoaded ? '下載範本格式 (Template)' : '正在載入工具...'}</button></div>
           </div>
        )}
      </main>
    </div>
  );
}
