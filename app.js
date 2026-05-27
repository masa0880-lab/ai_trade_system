(function () {
  "use strict";

  let currentSpread = null;
  let drawnCards = [];
  let isShuffling = false;

  const screens = {
    home: document.getElementById("screen-home"),
    shuffle: document.getElementById("screen-shuffle"),
    result: document.getElementById("screen-result")
  };

  function showScreen(name) {
    Object.values(screens).forEach(function (s) { s.classList.remove("active"); });
    screens[name].classList.add("active");
    window.scrollTo(0, 0);
  }

  // 星空生成
  function makeStars() {
    const container = document.getElementById("stars");
    const frag = document.createDocumentFragment();
    for (let i = 0; i < 60; i++) {
      const star = document.createElement("span");
      star.className = "star";
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 100 + "%";
      const size = Math.random() * 2 + 1;
      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.animationDelay = Math.random() * 3 + "s";
      star.style.animationDuration = (Math.random() * 2 + 2) + "s";
      frag.appendChild(star);
    }
    container.appendChild(frag);
  }

  // Fisher-Yatesシャッフルでカードを引く（正逆ランダム・重複なし）
  function drawCards(count) {
    const indices = TAROT_CARDS.map(function (_, i) { return i; });
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = indices[i]; indices[i] = indices[j]; indices[j] = t;
    }
    return indices.slice(0, count).map(function (idx) {
      return {
        card: TAROT_CARDS[idx],
        reversed: Math.random() < 0.5
      };
    });
  }

  // ホーム: スプレッド選択
  document.querySelectorAll(".spread-card").forEach(function (btn) {
    btn.addEventListener("click", function () {
      currentSpread = SPREADS[btn.dataset.spread];
      document.getElementById("shuffle-title").textContent = currentSpread.title;
      document.getElementById("question-input").value = "";
      resetDeck();
      showScreen("shuffle");
    });
  });

  // もどるボタン
  document.querySelectorAll("[data-back]").forEach(function (btn) {
    btn.addEventListener("click", function () { showScreen("home"); });
  });

  function resetDeck() {
    isShuffling = false;
    const deck = document.getElementById("deck-stack");
    deck.classList.remove("shuffling", "done");
    document.getElementById("shuffle-hint").textContent = "カードをタップしてシャッフル";
  }

  // デッキをタップ → シャッフル演出 → 結果へ
  const deckStack = document.getElementById("deck-stack");
  function handleDeckActivate() {
    if (isShuffling) return;
    isShuffling = true;
    deckStack.classList.add("shuffling");
    document.getElementById("shuffle-hint").textContent = "カードを選んでいます…";

    setTimeout(function () {
      drawnCards = drawCards(currentSpread.count);
      buildResult();
      showScreen("result");
      resetDeck();
    }, 1400);
  }
  deckStack.addEventListener("click", handleDeckActivate);
  deckStack.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleDeckActivate(); }
  });

  // 結果画面の組み立て
  function buildResult() {
    document.getElementById("result-title").textContent = currentSpread.title;
    const q = document.getElementById("question-input").value.trim();
    const qEl = document.getElementById("result-question");
    qEl.textContent = q ? "「" + q + "」" : "";
    qEl.style.display = q ? "block" : "none";

    const area = document.getElementById("cards-area");
    area.className = "cards-area layout-" + currentSpread.layout;
    area.innerHTML = "";

    const readings = document.getElementById("readings");
    readings.innerHTML = "";

    drawnCards.forEach(function (draw, i) {
      const pos = currentSpread.positions[i];

      // カード表示
      const wrap = document.createElement("div");
      wrap.className = "card-slot";
      wrap.innerHTML =
        '<span class="card-pos">' + pos + '</span>' +
        '<div class="tcard' + (draw.reversed ? " reversed" : "") + '">' +
          '<div class="tcard-inner">' +
            '<div class="tcard-back"><span>✦</span></div>' +
            '<div class="tcard-front">' +
              '<span class="tcard-num">' + romanize(draw.card.num) + '</span>' +
              '<span class="tcard-symbol">' + draw.card.symbol + '</span>' +
              '<span class="tcard-name">' + draw.card.name + '</span>' +
              '<span class="tcard-en">' + draw.card.en + '</span>' +
              '<span class="tcard-orient">' + (draw.reversed ? "逆位置" : "正位置") + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      area.appendChild(wrap);

      // めくり演出（順番に）
      const tcard = wrap.querySelector(".tcard");
      setTimeout(function () { tcard.classList.add("flipped"); }, 250 + i * 320);

      // タップで詳細
      tcard.addEventListener("click", function () { openModal(draw, pos); });

      // 読み解きカード
      const meaning = draw.reversed ? draw.card.reversed : draw.card.upright;
      const reading = document.createElement("div");
      reading.className = "reading";
      reading.style.animationDelay = (0.3 + i * 0.32) + "s";
      reading.innerHTML =
        '<div class="reading-head">' +
          '<span class="reading-pos">' + pos + '</span>' +
          '<span class="reading-card">' + draw.card.name +
            ' <em>(' + (draw.reversed ? "逆" : "正") + ')</em></span>' +
        '</div>' +
        '<p class="reading-text">' + meaning + '</p>';
      readings.appendChild(reading);
    });
  }

  // ローマ数字（0〜21）
  function romanize(n) {
    if (n === 0) return "0";
    const map = [
      [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
    ];
    let res = "", num = n;
    map.forEach(function (pair) {
      while (num >= pair[0]) { res += pair[1]; num -= pair[0]; }
    });
    return res;
  }

  // モーダル
  const modal = document.getElementById("modal");
  const modalBody = document.getElementById("modal-body");
  function openModal(draw, pos) {
    const c = draw.card;
    modalBody.innerHTML =
      '<span class="m-pos">' + pos + '</span>' +
      '<div class="m-symbol">' + c.symbol + '</div>' +
      '<h3 class="m-name">' + c.name + ' <span>' + romanize(c.num) + '</span></h3>' +
      '<p class="m-en">' + c.en + '</p>' +
      '<div class="m-keywords">' +
        c.keywords.map(function (k) { return '<span>' + k + '</span>'; }).join("") +
      '</div>' +
      '<div class="m-orient ' + (draw.reversed ? "rev" : "up") + '">' +
        (draw.reversed ? "逆位置" : "正位置") + '</div>' +
      '<p class="m-meaning">' + (draw.reversed ? c.reversed : c.upright) + '</p>';
    modal.classList.add("open");
  }
  function closeModal() { modal.classList.remove("open"); }
  document.getElementById("modal-close").addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });

  // もう一度
  document.getElementById("again-btn").addEventListener("click", function () {
    showScreen("shuffle");
  });

  makeStars();
})();
