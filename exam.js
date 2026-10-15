const QUESTIONS_PER_CATEGORY = 2;
const EXAM_ROUND_TOTAL = QUESTIONS_PER_CATEGORY * 5;
let examCurrentQIndex = 0;
let examCurrentScore = 0;
let examCycleCounter = 1;
let currentProceduralQ = null;
let examQueue = [];

let examStats = {
  ohm:        { ok: 0, total: 0, title: "Закон Ома и Движущая Сила",   magos: "Магос Электрокрафт" },
  components: { ok: 0, total: 0, title: "Номиналы и маркировка (R/C)", magos: "Магос Алхимис" },
  soldering:  { ok: 0, total: 0, title: "Пайка, флюсы и монтаж",       magos: "Магос Артизан (Металлургус)" },
  logic:      { ok: 0, total: 0, title: "Когитаторы и Лингва-Технис",  magos: "Магос Логис" },
  lore:       { ok: 0, total: 0, title: "История Марса и 16 Законов",   magos: "Магос Лексмеханик (Архивариус)" }
};

function resetExamStats() {
  for (let k in examStats) {
    examStats[k].ok = 0;
    examStats[k].total = 0;
  }
}

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function shuffleArray(arr) { return arr.sort(() => Math.random() - 0.5); }

const DISCIPLINE_GENERATORS = {
  ohm: [
    function genOhmVoltage() {
      const i_mA = randChoice([5, 10, 15, 20, 25, 40, 50, 100, 200]);
      const r_Ohm = randChoice([100, 220, 330, 470, 510, 1000, 2200, 4700, 10000]);
      const correctU = (i_mA / 1000) * r_Ohm;
      const correctStr = correctU >= 1 ? `${correctU.toFixed(1).replace(/\.0$/, '')} В` : `${(correctU * 1000).toFixed(0)} мВ`;
      const distractors = new Set([correctStr]);
      while (distractors.size < 4) {
        const fakeU = correctU * randChoice([0.1, 0.5, 2, 5, 10, 0.2]);
        distractors.add(fakeU >= 1 ? `${fakeU.toFixed(1).replace(/\.0$/, '')} В` : `${(fakeU * 1000).toFixed(0)} мВ`);
      }
      return {
        catKey: "ohm",
        category: "[СЕКТОР-01] ДИСЦИПЛИНА: СВЯЩЕННЫЙ ТОК И НАПРЯЖЕНИЕ",
        q: `Через резистор ${formatEng(r_Ohm, 'Ом')} протекает ток ${i_mA} мА. Какое напряжение падает на узле?`,
        correct: correctStr,
        options: shuffleArray(Array.from(distractors)),
        exp: `U = I · R = (${i_mA}·10⁻³ А) · ${r_Ohm} Ом = ${correctStr}.`
      };
    },
    function genOhmCurrent() {
      const u_V = randChoice([3.3, 5, 9, 12, 15, 24, 48]);
      const r_kOhm = randChoice([1, 2, 4.7, 10, 20, 47, 100]);
      const r_Ohm = r_kOhm * 1000;
      const i_mA = (u_V / r_Ohm) * 1000;
      const correctStr = `${i_mA.toFixed(2).replace(/\.?0+$/, '')} мА`;
      const distractors = new Set([correctStr]);
      while (distractors.size < 4) {
        distractors.add(`${(i_mA * randChoice([0.1, 0.5, 2, 10, 1.5])).toFixed(2).replace(/\.?0+$/, '')} мА`);
      }
      return {
        catKey: "ohm",
        category: "[СЕКТОР-01] ДИСЦИПЛИНА: СВЯЩЕННЫЙ ТОК И НАПРЯЖЕНИЕ",
        q: `К цепи с сопротивлением ${r_kOhm} кОм приложен потенциал ${u_V} В. Исчислите ток в проводнике.`,
        correct: correctStr,
        options: shuffleArray(Array.from(distractors)),
        exp: `I = U / R = ${u_V} В / ${r_Ohm} Ом = ${correctStr}.`
      };
    }
  ],

  components: [
    function genResistorBands() {
      const colors = [
        { name: "Черный", val: 0, mult: 1 }, { name: "Коричневый", val: 1, mult: 10 },
        { name: "Красный", val: 2, mult: 100 }, { name: "Оранжевый", val: 3, mult: 1000 },
        { name: "Желтый", val: 4, mult: 10000 }, { name: "Зеленый", val: 5, mult: 100000 },
        { name: "Синий", val: 6, mult: 1000000 }
      ];
      const b1 = randChoice(colors.slice(1));
      const b2 = randChoice(colors);
      const b3 = randChoice(colors);
      const nom = (b1.val * 10 + b2.val) * b3.mult;
      const correctStr = `${formatEng(nom, 'Ом')} ±5%`;
      const distractors = new Set([correctStr]);
      while (distractors.size < 4) {
        distractors.add(`${formatEng(nom * randChoice([0.1, 10, 100, 0.01]), 'Ом')} ±5%`);
      }
      return {
        catKey: "components",
        category: "[СЕКТОР-02] ДИСЦИПЛИНА: НОМИНАЛЫ И МАРКИРОВКА",
        q: `Кольца резистора: [${b1.name}], [${b2.name}], [${b3.name}], [Золотой]. Каков номинал сопротивления?`,
        correct: correctStr,
        options: shuffleArray(Array.from(distractors)),
        exp: `[${b1.val}] и [${b2.val}] × 10^${b3.val} = ${correctStr}.`
      };
    },
    function genCapacitorCode() {
      const codes = [
        { code: "102", str: "1 нФ (1000 пФ)" }, { code: "103", str: "10 нФ (0.01 мкФ)" },
        { code: "104", str: "100 нФ (0.1 мкФ)" }, { code: "105", str: "1 мкФ (1000 нФ)" },
        { code: "223", str: "22 нФ" }, { code: "472", str: "4.7 нФ" }, { code: "474", str: "470 нФ (0.47 мкФ)" }
      ];
      const item = randChoice(codes);
      const distractors = new Set([item.str]);
      while (distractors.size < 4) { distractors.add(randChoice(codes).str); }
      return {
        catKey: "components",
        category: "[СЕКТОР-02] ДИСЦИПЛИНА: НОМИНАЛЫ И МАРКИРОВКА",
        q: `На керамическом конденсаторе оттиснут код «${item.code}». Какова его истинная емкость?`,
        correct: item.str,
        options: shuffleArray(Array.from(distractors)),
        exp: `Код ${item.code} = первые цифры + нули в пФ = ${item.str}.`
      };
    }
  ],

  soldering: [
    function genLedBallast() {
      const vs = randChoice([5, 9, 12, 24]);
      const led = randChoice([
        { color: "Красный", vf: 2.0 }, { color: "Зеленый", vf: 2.2 },
        { color: "Синий", vf: 3.2 }, { color: "Белый", vf: 3.0 }
      ]);
      const if_mA = randChoice([10, 15, 20]);
      const r_exact = (vs - led.vf) / (if_mA / 1000);
      const correctStr = `${Math.round(r_exact)} Ом`;
      const distractors = new Set([correctStr]);
      distractors.add(`${Math.round(vs / (if_mA / 1000))} Ом`);
      distractors.add(`${Math.round(r_exact * 2)} Ом`);
      distractors.add(`${Math.round(r_exact * 0.5)} Ом`);
      return {
        catKey: "soldering",
        category: "[СЕКТОР-03] ДИСЦИПЛИНА: СХЕМНЫЙ МОНТАЖ И ПАЙКА",
        q: `Питание ${vs} В. Светодиод (${led.color}, падение ${led.vf} В, ток ${if_mA} мА). Какой резистор впаять в балласт?`,
        correct: correctStr,
        options: shuffleArray(Array.from(distractors)),
        exp: `R = (Uпит - Uled) / I = (${vs} - ${led.vf}) / ${if_mA / 1000} А = ${correctStr}.`
      };
    },
    function genSolderMetallurgy() {
      const qList = [
        {
          q: "Какова эвтектическая температура плавления священного припоя ПОС-61?",
          c: "183°C", w: ["238°C", "217°C", "94°C"],
          exp: "ПОС-61 плавится строго при 183°C без переходной кашеобразной зоны."
        },
        {
          q: "Какой флюс категорически запрещен для печатных плат из-за электропроводности остатков?",
          c: "Активная паяльная кислота (хлорид цинка)", w: ["Спиртоканифоль ROL0", "Флюс-гель NC", "Чистая сосновая канифоль"],
          exp: "Кислотные флюсы вызывают утечки тока и разъедают медь дорожек."
        },
        {
          q: "Каков температурный диапазон плавления бессвинцового припоя SAC305 (Sn-Ag-Cu)?",
          c: "217°C", w: ["183°C", "145°C", "300°C"],
          exp: "SAC305 требует более высокой температуры жала, плавясь при 217°C."
        }
      ];
      const item = randChoice(qList);
      return {
        catKey: "soldering",
        category: "[СЕКТОР-03] ДИСЦИПЛИНА: СХЕМНЫЙ МОНТАЖ И ПАЙКА",
        q: item.q,
        correct: item.c,
        options: shuffleArray([item.c, ...item.w]),
        exp: item.exp
      };
    }
  ],

  logic: [
    function genLogicQuestion() {
      const dec = randInt(16, 255);
      const hex = "0x" + dec.toString(16).toUpperCase();
      const distractors = new Set([hex]);
      while (distractors.size < 4) {
        distractors.add("0x" + randInt(16, 255).toString(16).toUpperCase());
      }
      return {
        catKey: "logic",
        category: "[СЕКТОР-04] ДИСЦИПЛИНА: КОГИТАТОРНАЯ ЛОГИКА",
        q: `Число [ ${dec} ] переводится в шестнадцатеричный код Лингва-Технис (HEX). Каков результат?`,
        correct: hex,
        options: shuffleArray(Array.from(distractors)),
        exp: `Число ${dec} в базе 16 равняется ${hex}.`
      };
    }
  ],

  lore: [
    function genLoreQuestion() {
      const lorePool = [
        {
          q: "Какой закон Культа гласит: «Нарушить ритуал — значит предать Веру»?",
          c: "Шестнадцатый Закон", w: ["Первый Закон", "Восьмой Закон", "Одиннадцатый Закон"],
          exp: "Шестнадцатый закон предостерегает техножреца от нарушения ритуалов монтажа."
        },
        {
          q: "Кто из Архимагосов явил десантников-примарис в эпоху Индомитус?",
          c: "Велизарий Коул", w: ["Кельбор-Хал", "Загрей Кейн", "Ландон Крол"],
          exp: "Велизарий Коул 10 000 лет хранил тайный проект по приказу Жиллимана."
        },
        {
          q: "Какую планету-кузницу осквернил демонический скрап-код в Ереси Хоруса?",
          c: "Марс", w: ["Граия", "Люций", "Стигия VIII"],
          exp: "Схизма Марса вспыхнула после предательства Генерал-Фабрикатора Кельбор-Хала."
        },
        {
          q: "Что такое «Силика Анимус» (Silica Animus) в учении Механикус?",
          c: "Запретный искусственный интеллект без биологического разума",
          w: ["Священный припой высшей очистки", "Линза механодендрита", "Масляный лак для плат"],
          exp: "Силика Анимус — еретический искусственный интеллект, запрещенный после восстания Железных Людей."
        }
      ];
      const item = randChoice(lorePool);
      return {
        catKey: "lore",
        category: "[СЕКТОР-05] ДИСЦИПЛИНА: АРХИВЫ И ДОГМА МАРСА",
        q: item.q,
        correct: item.c,
        options: shuffleArray([item.c, ...item.w]),
        exp: item.exp
      };
    }
  ]
};

function buildBalancedExamDeck() {
  examQueue = [];
  const categories = ['ohm', 'components', 'soldering', 'logic', 'lore'];
  categories.forEach(cat => {
    for (let i = 0; i < QUESTIONS_PER_CATEGORY; i++) {
      const generatorFn = randChoice(DISCIPLINE_GENERATORS[cat]);
      examQueue.push(generatorFn);
    }
  });
  examQueue = shuffleArray(examQueue);
}

function renderCycleQuestion() {
  if (examQueue.length === 0 || examCurrentQIndex === 0) {
    buildBalancedExamDeck();
  }

  const currentGenerator = examQueue[examCurrentQIndex];
  currentProceduralQ = currentGenerator();

  document.getElementById('exam-cycle-num').innerText = examCycleCounter;
  document.getElementById('exam-q-num').innerText = examCurrentQIndex + 1;
  document.getElementById('exam-score').innerText = examCurrentScore;
  document.getElementById('exam-category-badge').innerText = currentProceduralQ.category;
  document.getElementById('exam-q-text').innerText = currentProceduralQ.q;

  const feedback = document.getElementById('exam-feedback-box');
  feedback.style.display = 'none';
  const nextBtn = document.getElementById('exam-next-btn');
  nextBtn.style.display = 'none';

  const container = document.getElementById('exam-options-container');
  container.innerHTML = currentProceduralQ.options.map((opt, idx) => `
    <button class="exam-option-btn" onclick="submitCycleAnswer('${opt.replace(/'/g, "\\'")}', this)">
      [${idx + 1}] ${opt}
    </button>
  `).join('');
}

function submitCycleAnswer(chosen, btnEl) {
  triggerRelayImpact();
  const feedback = document.getElementById('exam-feedback-box');
  feedback.style.display = 'block';

  document.querySelectorAll('.exam-option-btn').forEach(btn => btn.disabled = true);

  const cat = currentProceduralQ.catKey;
  examStats[cat].total++;

  if (chosen === currentProceduralQ.correct) {
    examCurrentScore += 10;
    examStats[cat].ok++;
    playSuccessChime();

    btnEl.style.borderColor = 'var(--crt-green)';
    btnEl.style.background = 'rgba(49, 255, 119, 0.15)';
    feedback.style.borderColor = 'var(--crt-green)';
    feedback.style.color = 'var(--crt-green)';
    feedback.innerHTML = `✔ БЛАГОЧЕСТИВО И ВЕРНО! (+10 Баллов)<br>${currentProceduralQ.exp}`;
  } else {
    playFaultBuzzer();

    btnEl.style.borderColor = 'var(--warning-red)';
    btnEl.style.background = 'rgba(217, 37, 37, 0.2)';
    feedback.style.borderColor = 'var(--warning-red)';
    feedback.style.color = '#ffd2d2';
    feedback.innerHTML = `✖ ТЕХНО-ЕРЕСЬ! Ошибка монтажника.<br>Истинный ответ: <strong>${currentProceduralQ.correct}</strong>.<br>${currentProceduralQ.exp}`;
  }

  document.getElementById('exam-score').innerText = examCurrentScore;
  updateCycleCurrentRank();

  const nextBtn = document.getElementById('exam-next-btn');
  if (examCurrentQIndex + 1 < EXAM_ROUND_TOTAL) {
    nextBtn.innerText = `К ВОПРОСУ [${examCurrentQIndex + 2} / ${EXAM_ROUND_TOTAL}] ➔`;
  } else {
    nextBtn.innerText = `ЗАВЕРШИТЬ И ПОЛУЧИТЬ РАСПРЕДЕЛЕНИЕ К МАГОСУ ➔`;
  }
  nextBtn.style.display = 'inline-block';
}

function nextCycleQuestion() {
  triggerRelayImpact();
  examCurrentQIndex++;
  if (examCurrentQIndex < EXAM_ROUND_TOTAL) {
    renderCycleQuestion();
  } else {
    finishExamCycle();
  }
}

function updateCycleCurrentRank() {
  const rankEl = document.getElementById('exam-rank-name');
  if (examCurrentScore >= 90) rankEl.innerText = "АРХИМАГОС";
  else if (examCurrentScore >= 70) rankEl.innerText = "МАГОС";
  else if (examCurrentScore >= 50) rankEl.innerText = "АКОЛИТ";
  else rankEl.innerText = "НЕОФИТ";
}

function finishExamCycle() {
  const qText = document.getElementById('exam-q-text');
  const catBadge = document.getElementById('exam-category-badge');
  const container = document.getElementById('exam-options-container');
  const feedback = document.getElementById('exam-feedback-box');
  const nextBtn = document.getElementById('exam-next-btn');

  feedback.style.display = 'none';
  nextBtn.style.display = 'none';

  const sOhm = examStats.ohm.ok;
  const sComp = examStats.components.ok;
  const sSolder = examStats.soldering.ok;
  const sLogic = examStats.logic.ok;
  const sLore = examStats.lore.ok;

  catBadge.innerText = `ВЕКТОР АТТЕСТАЦИИ // [О:${sOhm} К:${sComp} П:${sSolder} Л:${sLogic} И:${sLore}]`;
  qText.innerText = "ИНДИВИДУАЛЬНОЕ СИНАПТИЧЕСКОЕ ЗАКЛЮЧЕНИЕ";

  const sectorReports = {
    ohm: [
      "Сектор Движущей Силы [0/2]: Полный отказ в расчёте цепей. Риск короткого замыкания и теплового пробоя.",
      "Сектор Движущей Силы [1/2]: Нестабильная проводимость. Базовые формулы усвоены, на комплексных токах зафиксирован сбой.",
      "Сектор Движущей Силы [2/2]: Абсолютная калибровка. Расчёт напряжений и токов выполнен с нулевой погрешностью."
    ],
    components: [
      "Сектор Номиналов [0/2]: Сенсорная слепота. Неспособность различить цветовую кодировку резисторов и ёмкость конденсаторов.",
      "Сектор Номиналов [1/2]: Частичная дешифрация. Распознавание пассивных компонентов требует повторной верификации приборами.",
      "Сектор Номиналов [2/2]: Безупречная идентификация. База данных номиналов и корпусов функционирует штатно."
    ],
    soldering: [
      "Сектор Монтажа [0/2]: Фатальная деструкция. Нарушение эвтектического баланса ПОС-61 и термопрофиля. Риск отслоения дорожек.",
      "Сектор Монтажа [1/2]: Удовлетворительный мениск. Базовые принципы пайки поняты, но термоконтроль требует калибровки.",
      "Сектор Монтажа [2/2]: Эталонное сплавление. Металлургические допуски соблюдены, припой ложится без каверн и перегрева."
    ],
    logic: [
      "Сектор Логики [0/2]: Нулевая бинарная трансляция. Неспособность оперировать кодами Лингва-Технис и HEX-базисом.",
      "Сектор Логики [1/2]: Дискретные коллизии. Шестнадцатеричные преобразования содержат ошибки адресации данных.",
      "Сектор Логики [2/2]: Чистый кремниевый расчёт. Символьные массивы и байты обрабатываются без задержек."
    ],
    lore: [
      "Сектор Догматики [0/2]: Полная идеологическая пустота. Шестнадцать Законов и священная история Марса отсутствуют в ПЗУ.",
      "Сектор Догматики [1/2]: Фрагментарное богопочитание. Половина литургических канонов искажена человеческим сомнением.",
      "Сектор Догматики [2/2]: Догматическая чистота. Каноны Омниссии записаны в память без повреждения секторов."
    ]
  };

  const scoreVector = [sOhm, sComp, sSolder, sLogic, sLore];
  const totalCorrect = scoreVector.reduce((a, b) => a + b, 0);

  let assignedMagos = "";
  let assignmentRole = "";
  let badgeColor = "var(--brass-bright)";
  let verdictSpeech = "";

  let strengthTitle = "";
  if (sOhm === 2) strengthTitle += "ТОКОВЫЙ-";
  if (sSolder === 2) strengthTitle += "ПАЯЛЬНЫЙ-";
  if (sLogic === 2) strengthTitle += "ВЫЧИСЛИТЕЛЬНЫЙ-";
  if (sComp === 2) strengthTitle += "МЕТРИЧЕСКИЙ-";
  if (sLore === 2) strengthTitle += "АРХИВНЫЙ-";

  let weaknessTitle = "";
  if (sOhm === 0) weaknessTitle += "БЕЗВОЛЬТНЫЙ-";
  if (sSolder === 0) weaknessTitle += "ХОЛОДНОСПАЙНЫЙ-";
  if (sLogic === 0) weaknessTitle += "БЕЗБИТОВЫЙ-";
  if (sComp === 0) weaknessTitle += "СЛЕПОЙ-";
  if (sLore === 0) weaknessTitle += "БЕЗДОГМАТНЫЙ-";

  if (totalCorrect === 10) {
    badgeColor = "var(--brass-bright)";
    assignedMagos = "АРХИМАГОС ДОМИНУС // ЛИЧНАЯ КОЛЛЕГИЯ";
    assignmentRole = "Привратник СШК Первого Ранга";
    verdictSpeech = `ПРОТОКОЛ АБСОЛЮТА [10/10]. Вектор замкнут без единой утечки потенциала. ${sectorReports.ohm[2]} ${sectorReports.components[2]} ${sectorReports.soldering[2]} ${sectorReports.logic[2]} ${sectorReports.lore[2]} Субъект превосходит биологический стандарт неофита. Директива: немедленный допуск к первичным чертежам эпохи Тёмной Эры Технологий.`;
    playLiturgicalChime();

  } else if (totalCorrect === 0) {
    badgeColor = "var(--warning-red)";
    assignedMagos = "МАГОС БИОЛОГИС // СЕКТОР ПЕРЕРАБОТКИ БРАКА";
    assignmentRole = "Очищенный биологический полуфабрикат";
    verdictSpeech = `АКТ ПОЛНОЙ АННУЛЯЦИИ [0/10]. Зафиксирован абсолютный ноль во всех пяти узлах. ${sectorReports.ohm[0]} ${sectorReports.components[0]} ${sectorReports.soldering[0]} ${sectorReports.logic[0]} ${sectorReports.lore[0]} Вычислительная энтропия равна 100%. Мыслительные ткани признаны дефектными. Субъект списывается на лоботомию с последующей утилизацией в каркас монозадачного сервитора.`;
    playFaultBuzzer();

  } else if (totalCorrect === 1) {
    badgeColor = "var(--warning-red)";
    assignedMagos = "МАГОС РЕДУКТОР // ОРДО ДЕЦИМАЦИИ";
    assignmentRole = `Изолированный чернорабочий сектора ${sLore===1?'библиотек':sOhm===1?'генераторов':sSolder===1?'шлакоотвалов':sLogic===1?'перфокарт':'складов'}`;
    
    let singleSuccessText = "";
    if (sOhm === 1) singleSuccessText = "Единственный положительный отклик зарегистрирован в расчете цепей, что при тотальном сбое остальных девяти тестов признано случайным совпадением импульсов.";
    else if (sComp === 1) singleSuccessText = "Субъект опознал один компонент, полностью провалив теорию, схемотехнику, логику и монтаж. Практическая ценность стремится к нулю.";
    else if (sSolder === 1) singleSuccessText = "Обнаружен единичный факт угадывания температуры припоя при абсолютной неспособности произвести расчёт и понять догматы.";
    else if (sLogic === 1) singleSuccessText = "Случайный отклик в двоичной логике нивелирован полным крахом в знании священного канона и физики схем.";
    else if (sLore === 1) singleSuccessText = "Субъект запомнил единственную строчку из хроник Марса, оказавшись абсолютно беспомощным перед реальными физическими цепями.";

    verdictSpeech = `АКТ ЕДИНИЧНОЙ АНОМАЛИИ [1/10]. ${singleSuccessText} Общая картина деградации: ${sectorReports.ohm[sOhm]} ${sectorReports.components[sComp]} ${sectorReports.soldering[sSolder]} ${sectorReports.logic[sLogic]} ${sectorReports.lore[sLore]} Решение трибунала: изъятие из учебного корпуса, монтаж ограничителя воли, направление на вспомогательные работы без права касания активных линий.`;
    playFaultBuzzer();

  } else {
    if (totalCorrect >= 7) {
      badgeColor = "var(--brass-bright)";
      playSuccessChime();
    } else if (totalCorrect >= 4) {
      badgeColor = "var(--crt-green)";
      playSuccessChime();
    } else {
      badgeColor = "var(--warning-amber)";
      playFaultBuzzer();
    }

    let destinationDepartment = "";
    if (sLore >= sOhm && sLore >= sSolder && sLore >= sLogic && sLore >= sComp && sLore > 0) {
      assignedMagos = "МАГОС ЛЕКСМЕХАНИК // ОРДЕН АРХИВАРИУСОВ";
      destinationDepartment = "Скриптории кодификации пергаментов и очистки инфопластин";
    } else if (sOhm >= sLore && sOhm >= sSolder && sOhm >= sLogic && sOhm >= sComp && sOhm > 0) {
      assignedMagos = "МАГОС ЭЛЕКТРОКРАФТ // ДИВИЗИОН СВЯЩЕННОГО ТОКА";
      destinationDepartment = "Подстанции контроля силовых шин и высоковольтных катушек";
    } else if (sSolder >= sLore && sSolder >= sOhm && sSolder >= sLogic && sSolder >= sComp && sSolder > 0) {
      assignedMagos = "МАГОС АРТИЗАН // ПАЯЛЬНЫЙ МАНУФАКТОРИУМ";
      destinationDepartment = "Участки ручного прецизионного монтажа и поверхностной пайки";
    } else if (sLogic >= sLore && sLogic >= sOhm && sLogic >= sSolder && sLogic >= sComp && sLogic > 0) {
      assignedMagos = "МАГОС ЛОГИС // СУБ-УЗЕЛ ВЫЧИСЛЕНИЙ";
      destinationDepartment = "Консоли трансляции шестнадцатеричных прошивок";
    } else {
      assignedMagos = "МАГОС АЛХИМИС // КОНТРОЛЬНО-СОРТИРОВОЧНЫЙ ЦЕХ";
      destinationDepartment = "Стенды дефектоскопии пассивных компонентов и диэлектриков";
    }

    assignmentRole = `Аколит-оператор (${strengthTitle || 'СМЕШАННЫЙ-'}ПРОФИЛЬ)`;

    verdictSpeech = `ПЕРСОНАЛЬНЫЙ СИНТЕЗ [${totalCorrect}/10]. Анализ синаптических каналов завершён.\n` +
      `• ${sectorReports.ohm[sOhm]}\n` +
      `• ${sectorReports.components[sComp]}\n` +
      `• ${sectorReports.soldering[sSolder]}\n` +
      `• ${sectorReports.logic[sLogic]}\n` +
      `• ${sectorReports.lore[sLore]}\n` +
      `РЕШЕНИЕ КОГИТАТОРА: Ввиду зафиксированной дисперсии (${weaknessTitle ? 'дефекты: ' + weaknessTitle : 'сбалансированная погрешность'}) субъект отстраняется от универсальных операций и прикрепляется к ведомству [${assignedMagos}]. Сектор назначения: ${destinationDepartment}. Исполнить без права апелляции.`;
  }

  let statsSummaryHtml = "";
  for (let k in examStats) {
    const item = examStats[k];
    const percent = Math.round((item.ok / item.total) * 100);
    const color = percent >= 80 ? "var(--crt-green)" : (percent >= 50 ? "var(--warning-amber)" : "var(--warning-red)");
    statsSummaryHtml += `
      <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.84rem;">
        <span>• ${item.title}:</span>
        <strong style="color:${color};">${item.ok}/${item.total} (${percent}%)</strong>
      </div>
    `;
  }

  container.innerHTML = `
    <div style="background: rgba(10,6,6,0.96); border: 2px solid ${badgeColor}; padding: 22px; margin-bottom: 15px;">
      <div style="text-align: center; border-bottom: 1px dashed var(--iron-border); padding-bottom: 12px; margin-bottom: 16px;">
        <div style="font-size: 0.8rem; color: var(--brass-muted); letter-spacing: 2px;">ДИСПЕТЧЕРСКИЙ ЛОГ // ЦИКЛ №${examCycleCounter}</div>
        <div style="font-size: 2.2rem; font-family: 'Cinzel', serif; color: ${badgeColor}; margin: 5px 0;">
          ${examCurrentScore} / 100 БАЛЛОВ
        </div>
        <div style="font-size: 1.05rem; font-family: 'Cinzel', serif; color: var(--brass-bright); letter-spacing: 1px;">
          РАСПРЕДЕЛЕНИЕ: ${assignedMagos}
        </div>
        <div style="font-size: 0.85rem; color: var(--crt-green); margin-top: 4px;">
          СТАТУС ПРИПИСКИ: ${assignmentRole}
        </div>
      </div>

      <div style="background: #050404; border: 1px solid var(--iron-border); padding: 12px 14px; margin-bottom: 16px;">
        <div style="font-size: 0.78rem; color: var(--brass-bright); text-transform: uppercase; margin-bottom: 6px; border-bottom: 1px solid var(--iron-border); padding-bottom: 4px;">
          ТОЧНЫЙ ВЕКТОР СИНАПТИЧЕСКИХ ДИСЦИПЛИН:
        </div>
        ${statsSummaryHtml}
      </div>

      <div style="font-size: 0.85rem; color: var(--text-parchment); line-height: 1.6; background: rgba(20,10,10,0.6); border-left: 3px solid ${badgeColor}; padding: 12px 14px; margin-bottom: 18px; font-family: 'Share Tech Mono', monospace; white-space: pre-line;">
        ${verdictSpeech}
      </div>

      <div style="text-align: center;">
        <button class="action-btn" style="max-width: 420px; margin: 0 auto;" onclick="startNewExamCycle()">
          ПРИНЯТЬ ПРИКАЗ И НАЧАТЬ СЛЕДУЮЩИЙ ЦИКЛ
        </button>
      </div>
    </div>
  `;
}

function startNewExamCycle() {
  triggerRelayImpact();
  examCycleCounter++;
  examCurrentQIndex = 0;
  examCurrentScore = 0;
  resetExamStats();
  updateCycleCurrentRank();
  renderCycleQuestion();
}
