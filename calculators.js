function formatEng(val, unit) {
  if (val === 0 || isNaN(val)) return "0 " + unit;
  const abs = Math.abs(val);
  if (abs >= 1e6) return (val / 1e6).toFixed(3).replace(/\.?0+$/, '') + ' М' + unit;
  if (abs >= 1e3) return (val / 1e3).toFixed(3).replace(/\.?0+$/, '') + ' к' + unit;
  if (abs >= 1) return val.toFixed(3).replace(/\.?0+$/, '') + ' ' + unit;
  if (abs >= 1e-3) return (val * 1e3).toFixed(3).replace(/\.?0+$/, '') + ' м' + unit;
  if (abs >= 1e-6) return (val * 1e6).toFixed(3).replace(/\.?0+$/, '') + ' мк' + unit;
  if (abs >= 1e-9) return (val * 1e9).toFixed(3).replace(/\.?0+$/, '') + ' н' + unit;
  if (abs >= 1e-12) return (val * 1e12).toFixed(3).replace(/\.?0+$/, '') + ' п' + unit;
  return val.toExponential(3) + ' ' + unit;
}

function convertTextToBinaric() {
  const str = document.getElementById('text-input').value;
  if (!str) {
    document.getElementById('text-out-bin').innerText = '00000000';
    document.getElementById('text-out-hex').innerText = '0x00';
    document.getElementById('text-out-oct').innerText = '000';
    return;
  }
  const enc = new TextEncoder();
  const bytes = enc.encode(str);
  let bArr = [], hArr = [], oArr = [];
  bytes.forEach(b => {
    bArr.push(b.toString(2).padStart(8, '0'));
    hArr.push(b.toString(16).toUpperCase().padStart(2, '0'));
    oArr.push(b.toString(8).padStart(3, '0'));
  });
  document.getElementById('text-out-bin').innerText = bArr.join(' ');
  document.getElementById('text-out-hex').innerText = hArr.join(' ');
  document.getElementById('text-out-oct').innerText = oArr.join(' ');
}

function decodeBinaricToText() {
  const raw = document.getElementById('decode-in').value.trim();
  const mode = document.getElementById('decode-type').value;
  const target = document.getElementById('decode-out');
  triggerRelayImpact();
  if (!raw) { target.innerText = "ПРЕДОСТЕРЕЖЕНИЕ: Поле священного шифра пусто."; return; }
  try {
    let byteBuffer = [];
    if (mode === 'bin') {
      const parts = raw.replace(/[^01]/g, ' ').split(/\s+/).filter(Boolean);
      parts.forEach(p => byteBuffer.push(parseInt(p, 2)));
    } else {
      const parts = raw.replace(/0x/gi, '').replace(/[^0-9A-Fa-f]/g, ' ').split(/\s+/).filter(Boolean);
      parts.forEach(p => byteBuffer.push(parseInt(p, 16)));
    }
    const uint8 = new Uint8Array(byteBuffer);
    const dec = new TextDecoder('utf-8', { fatal: true });
    target.innerText = `ТОЛКОВАНИЕ ОМНИССИИ: "${dec.decode(uint8)}"`;
  } catch (err) {
    playFaultBuzzer();
    target.innerText = "ОШИБКА ДЕКОДИРОВАНИЯ: Неканоническая последовательность байт UTF-8.";
  }
}

function convertRadixNumber() {
  const val = document.getElementById('radix-num-in').value.trim();
  const base = parseInt(document.getElementById('radix-base-in').value);
  if (!val) return;
  try {
    const dec = parseInt(val, base);
    if (isNaN(dec)) {
      document.getElementById('radix-out-bin').innerText = "НЕЧИСЛОВОЙ ЗНАК";
      document.getElementById('radix-out-oct').innerText = "-";
      document.getElementById('radix-out-dec').innerText = "-";
      document.getElementById('radix-out-hex').innerText = "-";
      return;
    }
    document.getElementById('radix-out-bin').innerText = (dec >>> 0).toString(2);
    document.getElementById('radix-out-oct').innerText = dec.toString(8);
    document.getElementById('radix-out-dec').innerText = dec.toString(10);
    document.getElementById('radix-out-hex').innerText = "0x" + dec.toString(16).toUpperCase();
  } catch(e) {
    document.getElementById('radix-out-dec').innerText = "ОШИБКА";
  }
}

function toggleBandsDisplay() {
  const qty = document.getElementById('band-qty').value;
  document.getElementById('band3-wrapper').style.display = (qty === '5') ? 'block' : 'none';
  calcResistorNominal();
}

function calcResistorNominal() {
  const qty = document.getElementById('band-qty').value;
  const b1 = document.getElementById('band1-val');
  const b2 = document.getElementById('band2-val');
  const b3 = document.getElementById('band3-val');
  const bM = document.getElementById('band-mult-val');
  const bT = document.getElementById('band-tol-val');

  document.getElementById('band1-el').style.background = b1.options[b1.selectedIndex].dataset.color;
  document.getElementById('band2-el').style.background = b2.options[b2.selectedIndex].dataset.color;
  document.getElementById('band4-el').style.background = bT.options[bT.selectedIndex].dataset.color;

  let nom = 0;
  if (qty === '4') {
    nom = (parseInt(b1.value) * 10 + parseInt(b2.value)) * parseFloat(bM.value);
    document.getElementById('band3-el').style.background = bM.options[bM.selectedIndex].dataset.color;
  } else {
    document.getElementById('band3-el').style.background = b3.options[b3.selectedIndex].dataset.color;
    nom = (parseInt(b1.value) * 100 + parseInt(b2.value) * 10 + parseInt(b3.value)) * parseFloat(bM.value);
  }
  document.getElementById('resistor-result-box').innerText = 
    `СВЯЩЕННЫЙ НОМИНАЛ: ${formatEng(nom, 'Ом')} ±${bT.value}%`;
}

const EIA96_MAP = {
  "01":100,"02":102,"03":105,"04":107,"05":110,"06":113,"07":115,"08":118,"09":121,"10":124,
  "11":127,"12":130,"13":133,"14":137,"15":140,"16":143,"17":147,"18":150,"19":154,"20":158,
  "21":162,"22":165,"23":169,"24":174,"25":178,"26":182,"27":187,"28":191,"29":196,"30":200,
  "31":205,"32":210,"33":215,"34":221,"35":226,"36":232,"37":237,"38":243,"39":249,"40":255,
  "41":261,"42":267,"43":274,"44":280,"45":287,"46":294,"47":301,"48":309,"49":316,"50":324,
  "51":332,"52":340,"53":348,"54":357,"55":365,"56":374,"57":383,"58":392,"59":402,"60":412,
  "61":422,"62":432,"63":442,"64":453,"65":464,"66":475,"67":487,"68":499,"69":511,"70":523,
  "71":536,"72":549,"73":562,"74":576,"75":590,"76":604,"77":619,"78":634,"79":649,"80":665,
  "81":681,"82":698,"83":715,"84":732,"85":750,"86":768,"87":787,"88":806,"89":825,"90":845,
  "91":866,"92":887,"93":909,"94":931,"95":953,"96":976
};
const EIA96_MULTS = { 'Z':0.001,'Y':0.01,'R':0.01,'X':0.1,'S':0.1,'A':1,'B':10,'C':100,'D':1000,'E':10000,'F':100000 };

function decodeSmdResistor() {
  let code = document.getElementById('smd-in').value.trim().toUpperCase();
  let out = document.getElementById('smd-out');
  if (!code) { out.innerText = "Ожидание ввода кода компонента..."; return; }
  if (code === '0' || code === '000' || code === '0000') {
    out.innerText = "НОМИНАЛ: 0.00 Ом (Священная перемычка Zero-Ohm Jumper)";
    return;
  }
  if (code.includes('R')) {
    let val = parseFloat(code.replace('R', '.'));
    if (!isNaN(val)) {
      out.innerText = `НОМИНАЛ: ${formatEng(val, 'Ом')} (Суб-омический прецизионный резистор)`;
      return;
    }
  }
  if (/^\d{3}$/.test(code)) {
    let val = parseInt(code.substring(0, 2)) * Math.pow(10, parseInt(code.charAt(2)));
    out.innerText = `СТАНДАРТ 3-DIGIT (±5%): ${formatEng(val, 'Ом')}`;
    return;
  }
  if (/^\d{4}$/.test(code)) {
    let val = parseInt(code.substring(0, 3)) * Math.pow(10, parseInt(code.charAt(3)));
    out.innerText = `СТАНДАРТ 4-DIGIT ПРЕЦИЗИОННЫЙ (±1%): ${formatEng(val, 'Ом')}`;
    return;
  }
  if (code.length === 3 && EIA96_MAP[code.substring(0, 2)] && EIA96_MULTS[code.charAt(2)]) {
    let val = EIA96_MAP[code.substring(0, 2)] * EIA96_MULTS[code.charAt(2)];
    out.innerText = `СТАНДАРТ EIA-96 (Точность ±1%): ${formatEng(val, 'Ом')}`;
    return;
  }
  playFaultBuzzer();
  out.innerText = "ОШИБКА ДЕШИФРАЦИИ: Код не числится в реестрах Марса.";
}

function decodeCapacitorNominal() {
  let code = document.getElementById('cap-code').value.trim().toUpperCase();
  let tol = document.getElementById('cap-tol').value;
  let out = document.getElementById('cap-result');
  if (!code) { out.innerText = "Введите священный код емкости..."; return; }
  let pF = 0;
  if (code.includes('P') || code.includes('N') || code.includes('U')) {
    let letter = code.match(/[PNU]/)[0];
    let parts = code.split(letter);
    let num = parseFloat((parts[0] || '0') + '.' + (parts[1] || '0'));
    if (letter === 'P') pF = num;
    if (letter === 'N') pF = num * 1000;
    if (letter === 'U') pF = num * 1000000;
  } else if (code.includes('R')) {
    pF = parseFloat(code.replace('R', '.'));
  } else if (/^\d{3}$/.test(code)) {
    pF = parseInt(code.substring(0, 2)) * Math.pow(10, parseInt(code.charAt(2)));
  } else if (/^\d{1,2}$/.test(code)) {
    pF = parseFloat(code);
  } else {
    playFaultBuzzer();
    out.innerText = "ПРЕДОСТЕРЕЖЕНИЕ: Неканонический формат маркировки емкости.";
    return;
  }
  let nF = pF / 1000;
  let uF = pF / 1000000;
  let tolStr = tol ? ` | Класс допуска: <strong>${tol}</strong>` : '';

  out.innerHTML = `
    <strong>СВЯЩЕННАЯ ЕМКОСТЬ СОСУДА:</strong><br>
    • Пикофарады: <strong>${pF.toLocaleString()} пФ</strong><br>
    • Нанофарады: <strong>${nF.toFixed(4).replace(/\.?0+$/, '')} нФ</strong><br>
    • Микрофарады: <strong>${uF.toFixed(6).replace(/\.?0+$/, '')} мкФ</strong><br>
    ${tolStr}
  `;
}

function calcOhmicTrinity() {
  let v = parseFloat(document.getElementById('ohm-v').value);
  let i = parseFloat(document.getElementById('ohm-i').value);
  let r = parseFloat(document.getElementById('ohm-r').value);
  let p = parseFloat(document.getElementById('ohm-p').value);
  let out = document.getElementById('ohm-out');
  triggerRelayImpact();

  let known = (!isNaN(v)?1:0) + (!isNaN(i)?1:0) + (!isNaN(r)?1:0) + (!isNaN(p)?1:0);
  if (known < 2) {
    playFaultBuzzer();
    out.innerText = "ПРЕДОСТЕРЕЖЕНИЕ: Омниссия требует ввести как минимум две величины.";
    return;
  }
  if (!isNaN(v) && !isNaN(i)) { r = v / i; p = v * i; }
  else if (!isNaN(v) && !isNaN(r)) { i = v / r; p = (v * v) / r; }
  else if (!isNaN(v) && !isNaN(p)) { i = p / v; r = (v * v) / p; }
  else if (!isNaN(i) && !isNaN(r)) { v = i * r; p = i * i * r; }
  else if (!isNaN(i) && !isNaN(p)) { v = p / i; r = p / (i * i); }
  else if (!isNaN(r) && !isNaN(p)) { v = Math.sqrt(p * r); i = Math.sqrt(p / r); }

  document.getElementById('ohm-v').value = v.toFixed(3).replace(/\.?0+$/, '');
  document.getElementById('ohm-i').value = i.toFixed(4).replace(/\.?0+$/, '');
  document.getElementById('ohm-r').value = r.toFixed(2).replace(/\.?0+$/, '');
  document.getElementById('ohm-p').value = p.toFixed(3).replace(/\.?0+$/, '');

  out.innerHTML = `ИТОГ РАСЧЕТА ОМА: Напряжение U = <strong>${v.toFixed(2)} В</strong> | Ток I = <strong>${(i*1000).toFixed(1)} мА</strong> | R = <strong>${formatEng(r, 'Ом')}</strong> | Мощность P = <strong>${formatEng(p, 'Вт')}</strong>`;
}

function calcLedResistor() {
  let vs = parseFloat(document.getElementById('led-vs').value);
  let vf = parseFloat(document.getElementById('led-vf').value);
  let ifMa = parseFloat(document.getElementById('led-if').value);
  let out = document.getElementById('led-out');
  triggerRelayImpact();

  if (isNaN(vs) || isNaN(vf) || isNaN(ifMa) || ifMa <= 0 || vs <= vf) {
    playFaultBuzzer();
    out.innerText = "ОШИБКА: U питания обязано превосходить прямое падение светодиода!";
    return;
  }
  let iA = ifMa / 1000;
  let r = (vs - vf) / iA;
  let power = (vs - vf) * iA;
  let packageRec = (power > 0.25) ? "Выводной 0.5 Вт / SMD 2010" : (power > 0.125 ? "SMD 1206 (0.25 Вт)" : "SMD 0805 (0.125 Вт)");

  out.innerHTML = `
    СОПРОТИВЛЕНИЕ: <strong>${formatEng(r, 'Ом')}</strong> (Ближайший номинал ряда E24)<br>
    Рассеиваемая мощность: <strong>${formatEng(power, 'Вт')}</strong> (${(power * 1000).toFixed(1)} мВт)<br>
    Рекомендуемый корпус: <strong>${packageRec}</strong>
  `;
}

function calcVoltageDivider() {
  let vin = parseFloat(document.getElementById('div-vin').value);
  let r1 = parseFloat(document.getElementById('div-r1').value);
  let r2 = parseFloat(document.getElementById('div-r2').value);
  let out = document.getElementById('div-out');
  triggerRelayImpact();

  if (isNaN(vin) || isNaN(r1) || isNaN(r2) || (r1 + r2) === 0) {
    playFaultBuzzer();
    out.innerText = "ОШИБКА: Проверьте значения плеч делителя.";
    return;
  }
  let vout = vin * (r2 / (r1 + r2));
  let cur = vin / (r1 + r2);

  out.innerHTML = `
    ВЫХОДНОЕ НАПРЯЖЕНИЕ (Uвых): <strong>${vout.toFixed(3)} В</strong><br>
    Сквозной ток делителя: <strong>${(cur * 1000).toFixed(2)} мА</strong> | Коэффициент: ${(vout / vin).toFixed(4)}
  `;
}

function calcThomsonAndReactance() {
  triggerRelayImpact();
  const f = parseFloat(document.getElementById('f-freq').value) * parseFloat(document.getElementById('f-freq-u').value);
  const L = parseFloat(document.getElementById('f-ind').value) * parseFloat(document.getElementById('f-ind-u').value);
  const C = parseFloat(document.getElementById('f-cap').value) * parseFloat(document.getElementById('f-cap-u').value);
  const out = document.getElementById('f-thomson-out');

  if (isNaN(f) || isNaN(L) || isNaN(C) || f <= 0 || L <= 0 || C <= 0) {
    playFaultBuzzer();
    out.innerText = "ПРЕДОСТЕРЕЖЕНИЕ: Параметры обязаны быть больше нуля.";
    return;
  }
  const f0 = 1 / (2 * Math.PI * Math.sqrt(L * C));
  const Xc = 1 / (2 * Math.PI * f * C);
  const XL = 2 * Math.PI * f * L;

  out.innerHTML = `
    РЕЗОНАНСНАЯ ЧАСТОТА КОНТУРА (f₀): <strong>${formatEng(f0, 'Гц')}</strong><br>
    Емкостное сопротивление Xc: <strong>${formatEng(Xc, 'Ом')}</strong><br>
    Индуктивное сопротивление XL: <strong>${formatEng(XL, 'Ом')}</strong>
  `;
}

function calcRcFilter() {
  triggerRelayImpact();
  const r = parseFloat(document.getElementById('rc-r').value) * parseFloat(document.getElementById('rc-r-u').value);
  const c = parseFloat(document.getElementById('rc-c').value) * parseFloat(document.getElementById('rc-c-u').value);
  const out = document.getElementById('rc-out');

  if (isNaN(r) || isNaN(c) || r <= 0 || c <= 0) {
    out.innerText = "ОШИБКА: R и C должны быть больше нуля.";
    return;
  }
  const fc = 1 / (2 * Math.PI * r * c);
  const tau = r * c;
  const t99 = 5 * tau;

  out.innerHTML = `
    ЧАСТОТА СРЕЗА ПО УРОВНЮ -3dB (fc): <strong>${formatEng(fc, 'Гц')}</strong><br>
    Постоянная времени контура (τ): <strong>${formatEng(tau, 'с')}</strong><br>
    Время полного заряда/разряда (5·τ, до 99.3%): <strong>${formatEng(t99, 'с')}</strong>
  `;
}

function calcCapEnergy() {
  triggerRelayImpact();
  const c_uF = parseFloat(document.getElementById('eq-c').value);
  const u = parseFloat(document.getElementById('eq-u').value);
  const out = document.getElementById('eq-c-out');

  if (isNaN(c_uF) || isNaN(u) || c_uF <= 0) {
    out.innerText = "ОШИБКА: Задайте корректные значения C и U.";
    return;
  }
  const c_F = c_uF * 1e-6;
  const Q = c_F * u;
  const E = 0.5 * c_F * (u * u);

  out.innerHTML = `
    ЗАРЯД ДИЭЛЕКТРИКА (Q): <strong>${formatEng(Q, 'Кл')}</strong><br>
    ЭНЕРГИЯ ПОЛЯ (Ec): <strong>${formatEng(E, 'Дж')}</strong> (${(E * 1000).toFixed(2)} мДж)
  `;
}

function calcIndEnergy() {
  triggerRelayImpact();
  const l_mH = parseFloat(document.getElementById('eq-l').value);
  const i = parseFloat(document.getElementById('eq-i').value);
  const out = document.getElementById('eq-l-out');

  if (isNaN(l_mH) || isNaN(i) || l_mH <= 0) {
    out.innerText = "ОШИБКА: Задайте корректные значения L и I.";
    return;
  }
  const l_H = l_mH * 1e-3;
  const E = 0.5 * l_H * (i * i);

  out.innerHTML = `
    ЭНЕРГИЯ МАГНИТНОГО ПОЛЯ (EL): <strong>${formatEng(E, 'Дж')}</strong> (${(E * 1000).toFixed(2)} мДж)
  `;
}

function calcCableDrop() {
  triggerRelayImpact();
  const l = parseFloat(document.getElementById('cable-l').value);
  const s = parseFloat(document.getElementById('cable-s').value);
  const i = parseFloat(document.getElementById('cable-i').value);
  const vin = parseFloat(document.getElementById('cable-vin').value);
  const out = document.getElementById('cable-out');

  if (isNaN(l) || isNaN(s) || isNaN(i) || isNaN(vin) || l <= 0 || s <= 0 || i <= 0 || vin <= 0) {
    out.innerText = "ОШИБКА: Проверьте значения кабельной линии.";
    return;
  }
  const rho = 0.0175;
  const R_loop = (2 * rho * l) / s;
  const deltaU = i * R_loop;
  const lossPercent = (deltaU / vin) * 100;
  const heatW = i * i * R_loop;
  const v_load = vin - deltaU;

  let warning = "";
  if (lossPercent > 5) {
    warning = `<span style="color: var(--warning-red); display: block; margin-top: 4px;">⚠ ПРЕДОСТЕРЕЖЕНИЕ: Потери превышают 5%! Рекомендуется увеличить сечение провода S.</span>`;
  }

  out.innerHTML = `
    СОПРОТИВЛЕНИЕ ПЕТЛИ КАБЕЛЯ (2x${l}м): <strong>${R_loop.toFixed(4)} Ом</strong><br>
    ПАДЕНИЕ НАПРЯЖЕНИЯ (ΔU): <strong>${deltaU.toFixed(3)} В</strong> (Остаток на нагрузке: <strong>${v_load.toFixed(2)} В</strong>)<br>
    ПОТЕРИ ВОЛЬТАЖА: <strong>${lossPercent.toFixed(2)} %</strong> | ТЕПЛО НА КАБЕЛЕ: <strong>${heatW.toFixed(2)} Вт</strong>
    ${warning}
  `;
}

function calcParallelResistors() {
  triggerRelayImpact();
  const r1 = parseFloat(document.getElementById('par-v1').value);
  const r2 = parseFloat(document.getElementById('par-v2').value);
  const r3 = parseFloat(document.getElementById('par-v3').value);
  const out = document.getElementById('par-out');

  if (isNaN(r1) || isNaN(r2) || r1 <= 0 || r2 <= 0) {
    out.innerText = "ОШИБКА: Введите как минимум R1 и R2 больше нуля.";
    return;
  }
  let inv = (1 / r1) + (1 / r2);
  let count = 2;
  if (!isNaN(r3) && r3 > 0) {
    inv += (1 / r3);
    count = 3;
  }
  const R_eq = 1 / inv;

  out.innerHTML = `
    ЭКВИВАЛЕНТ ПАРАЛЛЕЛЬНЫХ РЕЗИСТОРОВ (${count} шт.): <strong>${formatEng(R_eq, 'Ом')}</strong><br>
    (Формула: 1/Req = 1/R1 + 1/R2${count === 3 ? ' + 1/R3' : ''})
  `;
}

function calcSeriesCapacitors() {
  triggerRelayImpact();
  const c1 = parseFloat(document.getElementById('par-v1').value);
  const c2 = parseFloat(document.getElementById('par-v2').value);
  const c3 = parseFloat(document.getElementById('par-v3').value);
  const out = document.getElementById('par-out');

  if (isNaN(c1) || isNaN(c2) || c1 <= 0 || c2 <= 0) {
    out.innerText = "ОШИБКА: Введите как минимум C1 и C2 больше нуля.";
    return;
  }
  let inv = (1 / c1) + (1 / c2);
  let count = 2;
  if (!isNaN(c3) && c3 > 0) {
    inv += (1 / c3);
    count = 3;
  }
  const C_eq = 1 / inv;

  out.innerHTML = `
    ЭКВИВАЛЕНТ ПОСЛЕДОВАТЕЛЬНЫХ КОНДЕНСАТОРОВ (${count} шт.): <strong>${C_eq.toFixed(3)}</strong> (в тех же единицах)<br>
    (Формула: 1/Ceq = 1/C1 + 1/C2${count === 3 ? ' + 1/C3' : ''})
  `;
}

function calcTransformer() {
  triggerRelayImpact();
  const u1 = parseFloat(document.getElementById('tr-u1').value);
  const u2 = parseFloat(document.getElementById('tr-u2').value);
  const n1 = parseFloat(document.getElementById('tr-n1').value);
  const out = document.getElementById('tr-out');

  if (isNaN(u1) || isNaN(u2) || isNaN(n1) || u1 <= 0 || u2 <= 0 || n1 <= 0) {
    out.innerText = "ОШИБКА: Задайте положительные значения параметров трансформатора.";
    return;
  }
  const K = u1 / u2;
  const n2 = Math.round(n1 / K);
  const type = K > 1 ? "Понижающий" : (K < 1 ? "Повышающий" : "Разделительный 1:1");

  out.innerHTML = `
    ТИП ТРАНСФОРМАТОРА: <strong>${type}</strong><br>
    КОЭФФИЦИЕНТ ТРАНСФОРМАЦИИ (K = U1/U2): <strong>${K.toFixed(3)}</strong><br>
    РАСЧЕТНОЕ ЧИСЛО ВИТКОВ ВТОРИЧКИ (N2): <strong>${n2} витков</strong>
  `;
}

const SOLDER_DATA = {
  pos61: { name: "ПОС-61 (Эвтектика)", t_melt: 183, base_offset: 70, leaded: true },
  pos40: { name: "ПОС-40", t_melt: 238, base_offset: 65, leaded: true },
  sac305: { name: "SAC305 (Бессвинцовый)", t_melt: 217, base_offset: 90, leaded: false },
  rose: { name: "Сплав Розе", t_melt: 94, base_offset: 50, leaded: true },
  wood: { name: "Сплав Вуда", t_melt: 68, base_offset: 45, leaded: true },
  poin52: { name: "ПОИн-52 (Индиевый)", t_melt: 118, base_offset: 50, leaded: false }
};

function calcSolderingThermalProfile() {
  triggerRelayImpact();
  const solderKey = document.getElementById('solder-type').value;
  const heatSink = document.getElementById('solder-heat-sink').value;
  const tip = document.getElementById('solder-tip').value;
  const out = document.getElementById('soldering-profile-out');

  const s = SOLDER_DATA[solderKey];
  let t_iron = s.t_melt + s.base_offset;
  let t_preheat = 0;
  let contact_sec = "2 — 3.5 сек";
  let warning = "";

  if (heatSink === 'ground_plane') {
    t_iron += 35;
    t_preheat = 90;
    contact_sec = "3 — 5 сек";
  } else if (heatSink === 'heavy_bus') {
    t_iron += 60;
    t_preheat = 120;
    contact_sec = "4 — 7 сек";
  } else if (heatSink === 'smd_fine') {
    t_iron -= 15;
    contact_sec = "1 — 2 сек";
  }

  if (tip === 'needle') {
    t_iron += 20;
  } else if (tip === 'knife') {
    t_iron -= 10;
  }

  if (t_iron > 370) {
    playFaultBuzzer();
    warning = `<span style="color:var(--warning-red); display:block; margin-top:6px;">⚠ ОПАСНОСТЬ ТЕРМОУДАРА: Температура жала превышает 370°C! Высокий риск деградации кристалла и отслоения дорожек! Обязателен нижний преднагрев платы!</span>`;
  } else {
    playLiturgicalChime();
  }

  out.innerHTML = `
    <strong>СВЯЩЕННЫЙ ТЕРМОПРОФИЛЬ:</strong><br>
    • Припой: <strong>${s.name}</strong> (Точка плавления: <strong>${s.t_melt}°C</strong>)<br>
    • Рекомендуемая температура жала: <strong>${t_iron}°C</strong><br>
    • Нижний подогрев платы (Преднагрев): <strong>${t_preheat > 0 ? t_preheat + '°C' : 'Не требуется (Комнатная)'}</strong><br>
    • Максимальное время контакта с площадкой: <strong>${contact_sec}</strong>
    ${warning}
  `;
}
