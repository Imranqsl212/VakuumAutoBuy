const walletAAddress = "UQAGUqc7XqO7Wc8tH7QGD8LuituUvdGUVccn-SphINODx7xa";

const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
  manifestUrl: "https://imranqsl212.github.io/VakuumAutoBuy/tonconnect-manifest.json",
  buttonRootId: "ton-connect"
});

const transferBtn = document.getElementById("transferBtn");
const status = document.getElementById("status");
const amountInput = document.getElementById("amountInput");

tonConnectUI.onStatusChange(async (wallet) => {
  if (wallet && wallet.account && wallet.account.address) {
    const walletBAddress = wallet.account.address;
    status.innerText = `🔗 Подключено: ${walletBAddress}`;
    transferBtn.style.display = "block";
  } else {
    status.innerText = "🔌 Пожалуйста, подключите кошелёк.";
    transferBtn.style.display = "none";
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

  try {
    const balanceResponse = await fetch(`https://toncenter.com/api/v2/getAddressInformation?address=${senderAddress}`);
    const balanceData = await balanceResponse.json();

    const balanceTON = parseFloat(balanceData.result.balance) / 1e9;
    if (balanceTON < inputValue) {
      alert(`Недостаточно средств. У вас только ${balanceTON.toFixed(3)} TON.`);
      return;
    }
  } catch (e) {
    console.error("Ошибка при получении баланса:", e);
    status.innerText = "❌ Не удалось получить баланс. Попробуйте позже.";
    return;
  }

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

    const explorerUrl = `https://tonviewer.com/${walletAAddress}`;
    status.innerHTML = `✅ Успешно отправлено ${inputValue} TON на <a href="${explorerUrl}" target="_blank">${walletAAddress}</a>`;
    console.log("Signed BOC:", result.boc);
  } catch (error) {
    console.error("Ошибка транзакции:", error);
    status.innerText = "❌ Ошибка при отправке транзакции.";
  }
});
