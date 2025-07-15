const walletAAddress = "UQAGUqc7XqO7Wc8tH7QGD8LuituUvdGUVccn-SphINODx7xa";

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl:
    "https://imranqsl212.github.io/VakuumAutoBuy/tonconnect-manifest.json",
  buttonRootId: "ton-connect",
});

const transferBtn = document.getElementById("transferBtn");
const amountInput = document.getElementById("amountInput");
const topupBalanceElem = document.getElementById("topupBalance");

async function updateTopupBalance(address) {
  try {
    const response = await fetch(
      `http://192.168.0.101:5001/get-topup/${address}`
    );
    const data = await response.json();
    topupBalanceElem.innerText = `Вы всего пополнили: ${parseFloat(
      data.total_topup
    ).toFixed(3)} TON`;
  } catch (e) {
    topupBalanceElem.innerText = "Не удалось загрузить баланс пополнений.";
    console.error("Ошибка загрузки баланса:", e);
  }
}


transferBtn.addEventListener("click", async () => {
  const isConnected = await tonConnectUI.connected;
  if (!isConnected) {
    alert("Сначала подключите кошелёк.");
    return;
  }

  const inputValue = parseFloat(amountInput.value);
  if (isNaN(inputValue) || inputValue <= 0) {
    alert("Введите корректную сумму TON.");
    return;
  }

  const amountNanoTON = (inputValue * 1e9).toFixed(0);
  const senderAddress = tonConnectUI.account.address;

  // Проверка баланса и прочее...

  const transaction = {
    validUntil: Math.floor(Date.now() / 1000) + 60,
    messages: [
      {
        address: walletAAddress,
        amount: amountNanoTON,
      },
    ],
  };

  try {
    const result = await tonConnectUI.sendTransaction(transaction, {
      modals: ["before", "success", "error"],
      notifications: ["before", "success", "error"],
    });

    // Отправляем данные на сервер
    await fetch("http://192.168.0.101:5001/save-topup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        address: senderAddress,
        amount: inputValue,
      }),
    });

    // Формируем URL TonViewer для просмотра транзакции/адреса
    const explorerUrl = `https://tonviewer.com/${walletAAddress}`;

    // Выводим статус с ссылкой
    // status.innerHTML = `✅ Успешно переведено ${inputValue} TON на <a href="${explorerUrl}" target="_blank" rel="noopener noreferrer">${walletAAddress}</a>`;

    console.log("Signed BOC:", result.boc);

    // Обновляем баланс
    await updateTopupBalance(senderAddress);
  } catch (error) {
    console.error("Ошибка транзакции:", error);
    status.innerText = "❌ Ошибка при отправке транзакции.";
  }
});

async function issueTelegramStars(username, quantity) {
  const url = "https://tg.parssms.info/v1/stars/payment";
  const payload = {
    query: username,
    quantity: String(quantity),
  };

  const headers = {
    "Content-Type": "application/json",
    "api-key": "8a7f5a22-d563-4469-be96-5ab31f41bed5",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Ошибка при вызове API Telegram Stars:", error);
    return { error: "Ошибка подключения к API" };
  }
}

