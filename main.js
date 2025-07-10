const walletAAddress = "UQA72LFQ2TZqZI61ra_OaHW05vZJ9DNcqulKaD1ng6mHjavV";

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://imranqsl212.github.io/VakuumAutoBuy/tonconnect-manifest.json",
  buttonRootId: "ton-connect"
});

const transferBtn = document.getElementById("transferBtn");
const status = document.getElementById("status");
const amountInput = document.getElementById("amountInput");

// Элемент для отображения баланса пополнений
const topupBalanceElem = document.getElementById("topupBalance");

// Функция получить и показать сумму пополнений
async function updateTopupBalance(address) {
  try {
    const response = await fetch(`http://192.168.0.101:5001/get-topup/${address}`);
    const data = await response.json();
    topupBalanceElem.innerText = `Вы всего пополнили: ${parseFloat(data.total_topup).toFixed(3)} TON`;
  } catch (e) {
    topupBalanceElem.innerText = "Не удалось загрузить баланс пополнений.";
    console.error("Ошибка загрузки баланса:", e);
  }
}

tonConnectUI.onStatusChange(async (wallet) => {
  if (wallet && wallet.account && wallet.account.address) {
    const walletBAddress = wallet.account.address;
    status.innerText = `🔗 Подключено: ${walletBAddress}`;
    transferBtn.style.display = "block";
    await updateTopupBalance(walletBAddress);
  } else {
    status.innerText = "🔌 Пожалуйста, подключите кошелёк.";
    transferBtn.style.display = "none";
    topupBalanceElem.innerText = "";
  }
});

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
        amount: amountNanoTON
      }
    ]
  };

  try {
    const result = await tonConnectUI.sendTransaction(transaction, {
      modals: ['before', 'success', 'error'],
      notifications: ['before', 'success', 'error']
    });

    // Сохраняем пополнение на сервере
    await fetch('http://192.168.0.101:5001/save-topup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address: senderAddress,
        amount: inputValue
      })
    });

    status.innerHTML = `✅ Успешно отправлено ${inputValue} TON на <b>${walletAAddress}</b>`;
    await updateTopupBalance(senderAddress);
  } catch (error) {
    console.error("Ошибка транзакции:", error);
    status.innerText = "❌ Ошибка при отправке транзакции.";
  }
});