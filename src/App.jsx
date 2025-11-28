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
      { id: 'cl', label: '氯
